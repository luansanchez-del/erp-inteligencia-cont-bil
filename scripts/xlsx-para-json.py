"""Converte uma aba de uma planilha .xlsx em JSON (lista de linhas).

Uso: python scripts/xlsx-para-json.py ENTRADA.xlsx SAIDA.json [NOME DA ABA]
Sem o nome, usa a primeira aba. Usado pelos geradores .mjs, porque o projeto não tem leitor de xlsx em Node.
"""
import datetime
import json
import sys

import openpyxl

livro = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
aba = livro[sys.argv[3]] if len(sys.argv) > 3 else livro.worksheets[0]
linhas = [
    [c.strftime("%d/%m/%Y") if isinstance(c, datetime.datetime) else c for c in linha]
    for linha in aba.iter_rows(values_only=True)
]
with open(sys.argv[2], "w", encoding="utf-8") as saida:
    json.dump(linhas, saida, ensure_ascii=False, default=str)
