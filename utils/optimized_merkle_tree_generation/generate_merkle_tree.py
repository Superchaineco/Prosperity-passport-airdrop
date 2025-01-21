import json
from eth_abi import encode
from eth_utils import keccak
from tqdm import tqdm

ZERO_HASH = "0x" + "00" * 32


def hash_leaf_pairs(left: str, right: str) -> str:
    """
    Emula la función Solidity:
        function hashLeafPairs(bytes32 left, bytes32 right) returns (bytes32)
    que ordena left y right antes de hashearlos, según:
        if (left < right) => concatenar left||right
        else => concatenar right||left
    """
    # Extraer bytes (omitimos '0x')
    lb = bytes.fromhex(left[2:])
    rb = bytes.fromhex(right[2:])

    # Ordenar
    if lb < rb:
        combined = lb + rb
    else:
        combined = rb + lb

    # keccak256
    return "0x" + keccak(combined).hex()


def hash_level(data):
    """
    Genera el nivel superior del árbol a partir del nivel actual.
    """
    length = len(data)
    if length < 2:
        # No tiene sentido procesar si hay menos de 2
        return data

    # Calcular el tamaño del siguiente nivel
    # Si length es impar => length // 2 + 1, si es par => length // 2
    if (length & 0x1) == 1:
        # Impar
        result_size = (length // 2) + 1
    else:
        # Par
        result_size = length // 2

    result = []
    i = 0
    # Combinar de 2 en 2
    while i < length - 1:
        combined = hash_leaf_pairs(data[i], data[i + 1])
        result.append(combined)
        i += 2

    # Si es impar, combinar último con 0
    if (length & 0x1) == 1:
        last_combined = hash_leaf_pairs(data[length - 1], ZERO_HASH)
        result.append(last_combined)

    # Asegurar que coincida con result_size
    assert (
        len(result) == result_size
    ), f"Resultado distinto del esperado: {len(result)} != {result_size}"
    return result


def double_hash_leaf(receiver: str, quantity: int) -> str:
    """
    Emula: keccak256(bytes.concat(keccak256(abi.encode(receiver, quantity))))
    """
    # 1. Codificar los parámetros en ABI (sin función selector)
    encoded = encode(["address", "uint256"], [receiver, quantity])
    # 2. Primera pasada de keccak
    inner_hash = keccak(encoded)
    # 3. Segunda pasada de keccak
    final_hash = keccak(inner_hash)
    return "0x" + final_hash.hex()


def get_root(data: list) -> str:
    """
    Emula la función Solidity:
        function getRoot(bytes32[] memory data) public pure returns (bytes32)
    Itera aplicando hashLevel hasta que quede un solo hash.
    """
    # Hacemos copia para no mutar el original
    arr = data[:]
    # Requiere que arr.length > 1
    assert len(arr) > 1, "won't generate root for single leaf"

    while len(arr) > 1:
        arr = hash_level(arr)
    return arr[0]


def log2ceil_bit_magic(x: int) -> int:
    """
    Emula la función:
        function log2ceilBitMagic(uint256 x) returns (uint256)
    Retorna la parte entera de log2(x), redondeando hacia arriba.
    """
    if x <= 1:
        return 0

    msb = 0
    tmp = x
    if tmp >= (1 << 128):
        tmp >>= 128
        msb += 128
    if tmp >= (1 << 64):
        tmp >>= 64
        msb += 64
    if tmp >= (1 << 32):
        tmp >>= 32
        msb += 32
    if tmp >= (1 << 16):
        tmp >>= 16
        msb += 16
    if tmp >= (1 << 8):
        tmp >>= 8
        msb += 8
    if tmp >= (1 << 4):
        tmp >>= 4
        msb += 4
    if tmp >= (1 << 2):
        tmp >>= 2
        msb += 2
    if tmp >= (1 << 1):
        msb += 1

    # Checar si x es potencia de 2 exacta
    # si es potencia de 2, no sumamos 1
    # en solidity:
    #    uint256 lsb = (~_x + 1) & _x;
    #    if ((lsb == _x) && (msb > 0)) => msb
    #    else => msb+1
    # Reproducimos
    lsb = ((~(x - 1)) + 1) & x  # (~_x + 1) & _x => adaptamos x->(x-1)
    # Ojo con (x-1) si x=0 => no pasa porque x>1
    if (lsb == x) and (msb > 0):
        return msb
    else:
        return msb + 1


def precalculate_tree(leaves: list) -> list:
    """
    Genera todos los niveles del Merkle tree.
    tree[0] = leaves originales
    tree[i] = siguiente nivel
    El último nivel tendrá un solo hash (la raíz).
    """
    tree = [leaves]
    while len(tree[-1]) > 1:
        current_level = tree[-1]
        next_level = []
        length = len(current_level)
        i = 0
        while i < length - 1:
            next_level.append(hash_leaf_pairs(current_level[i], current_level[i + 1]))
            i += 2
        if (length & 0x1) == 1:  # impar
            next_level.append(hash_leaf_pairs(current_level[length - 1], ZERO_HASH))
        tree.append(next_level)
    return tree


def get_proof_from_tree(tree: list, node: int) -> list:
    """
    Genera la prueba de Merkle para un nodo dado,
    usando los niveles precalculados en `tree`.
    
    tree[nivel] es la lista de hashes en ese nivel.
    """
    proof_size = log2ceil_bit_magic(len(tree[0]))  # basamos en la cantidad de hojas
    result = [ZERO_HASH] * proof_size

    pos = 0
    # Iteramos todos los niveles excepto la raíz (que está en tree[-1])
    for level_index in range(len(tree) - 1):
        level = tree[level_index]
        if (node & 0x1) == 1:
            # Hermano izquierdo
            result[pos] = level[node - 1]
        elif (node + 1) == len(level):
            # Caso nodo sin hermano
            result[pos] = ZERO_HASH
        else:
            # Hermano derecho
            result[pos] = level[node + 1]

        pos += 1
        node //= 2

    # Podamos los ceros al final si no los necesitamos
    while len(result) > 0 and result[-1] == ZERO_HASH:
        result.pop()

    return result


def main():
    # Leer datos de input.json
    with open("input.json", "r") as f:
        input_data = json.load(f)

    # 1. Generar las hojas (leaves)
    leaves = []
    inputs_list = []
    for i in tqdm(range(input_data["count"]), desc="Generando hojas", unit="hoja"):
        address = input_data["values"][str(i)]["0"]
        amount = int(input_data["values"][str(i)]["1"])
        leaf = double_hash_leaf(address, amount)
        leaves.append(leaf)
        inputs_list.append([address, str(amount)])

    # Construir el Merkle tree

    # Generar las pruebas y la salida final
    output = {}
    print("Precargando niveles del Merkle Tree...")
    tree = precalculate_tree(leaves)
    root = get_root(leaves)

    for i, leaf in tqdm(
        enumerate(leaves), desc="Generando pruebas", total=len(leaves), unit="prueba"
    ):
        proof = get_proof_from_tree(tree, i)
        entry = {
            "inputs": inputs_list[i],
            "proof": proof,
            "root": root,
            "leaf": leaf,
        }
        output[f'{inputs_list[i][0]}'] = entry

    # Guardar el resultado en un archivo JSON
    with open("output.json", "w") as f:
        json.dump(output, f, indent=2)

    print(f"Merkle root: {root}")
    print("Output written to output.json")


if __name__ == "__main__":
    main()
