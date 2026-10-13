"""Converte a primeira aba de uma planilha .xlsx em JSON (lista de linhas).

Uso: python scripts/xlsx-para-json.py ENTRADA.xlsx SAIDA.json
Usado pelos geradores .mjs, porque o projeto não tem leitor de xlsx em Node.
"""
import json
import sys

import openpyxl

livro = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
linhas = [list(linha) for linha in livro.worksheets[0].iter_rows(values_only=True)]
with open(sys.argv[2], "w", encoding="utf-8") as saida:
    json.dump(linhas, saida, ensure_ascii=False, default=str)
