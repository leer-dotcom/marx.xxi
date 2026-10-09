"""Firma para los commits: dos iniciales aleatorias con el formato «L.L.» (sin W, X, Y ni Z).

Uso: python tools/iniciales.py   ->   p. ej. «M.R.»
"""
import secrets
import string

LETRAS = [c for c in string.ascii_uppercase if c not in "WXYZ"]

if __name__ == "__main__":
    print(f"{secrets.choice(LETRAS)}.{secrets.choice(LETRAS)}.")
