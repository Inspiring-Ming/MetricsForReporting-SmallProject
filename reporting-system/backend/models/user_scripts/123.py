# Python Implementation Editor
# Rules for compatibility:
# - Read inputs from sys.argv (1-based), matching the number of selected inputs.
# - Compute and print a single JSON line as the final output: {"result": <value>}.
# - You may print debug lines before, but the last printed line must be the JSON.

category = "Energy Management in Manufacturing"
metric = "Percentage Grid Electricity"
input_names = ["Grid Electricity","Total Energy"]
model_name = "123"
implementation_name = "123.py"

import sys, json, math

def parse_args(names):
    vals = []
    for i, _ in enumerate(names, start=1):
        try:
            vals.append(float(sys.argv[i]))  # 1-based indexing for args
        except:
            # Fallback if missing/invalid arg; adjust as needed
            vals.append(0.0)
    return vals

def compute(args):
    # TODO: implement your logic here
    # Example: percentage ratio with divide-by-zero guard
    if len(args) >= 2 and args[1] != 0:
        return (args[0] / args[1]) * 100.0
    return None

args = parse_args(input_names)
print('category:', category)
print('metric:', metric)
print('model_name:', model_name)
print('implementation_name:', implementation_name)
print('input_names:', input_names)
print('args:', args)
result = compute(args)

# IMPORTANT: this must be the last printed line for the platform to parse the result
print(json.dumps({"result": result}))
