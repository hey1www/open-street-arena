import csv, json

def coerce_num(s):
    s = s.strip()
    if s == "": return None
    try:
        return float(s)
    except:
        return s

rows = []
with open("incidents.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for r in reader:
        # 强制类型：lat/lng 数字，其它保持字符串
        r["lat"] = coerce_num(r.get("lat",""))
        r["lng"] = coerce_num(r.get("lng",""))
        rows.append(r)

with open("incidents.json", "w", encoding="utf-8") as w:
    json.dump(rows, w, ensure_ascii=False, indent=2)

print("OK -> incidents.json")
