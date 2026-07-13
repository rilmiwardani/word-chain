import re

input_file = "kamus_tambahan.txt"
output_file = "output.txt"

hasil = set()

# Hanya huruf A-Z dan a-z
pattern = re.compile(r'^[A-Za-z]+$')

with open(input_file, "r", encoding="utf-8") as f:
    for line in f:
        kata = line.strip()

        if not kata:
            continue

        # Harus hanya terdiri dari huruf
        if pattern.fullmatch(kata):
            hasil.add(kata.upper())

hasil = sorted(hasil)

with open(output_file, "w", encoding="utf-8") as f:
    for kata in hasil:
        f.write(kata + "\n")

print(f"Selesai! {len(hasil)} kata disimpan ke '{output_file}'.")