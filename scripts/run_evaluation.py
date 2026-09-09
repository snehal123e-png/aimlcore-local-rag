"""Evaluation scaffold. Extend with expected-source matching and answer grading."""
import csv
from pathlib import Path
p=Path(__file__).parents[1]/'evaluation/questions.csv'
rows=list(csv.DictReader(p.open(encoding='utf-8')))
print(f'Loaded {len(rows)} evaluation cases. Add the full 50+ case benchmark before reporting metrics.')
