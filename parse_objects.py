import json
import sys

try:
    with open('all_objects.json', 'r', encoding='utf-16le') as f:
        data = json.load(f)
    
    for obj in data:
        obj_id = obj['objectId']
        obj_type = obj['type']
        print(f"{obj_id} | {obj_type}")
except Exception as e:
    print(f"Error: {e}")
