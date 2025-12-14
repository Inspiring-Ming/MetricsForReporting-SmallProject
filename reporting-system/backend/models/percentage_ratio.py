import sys
import json

def percentage_ratio_model(m1, m2):
    return (m1/m2) * 100

if __name__ == "__main__":
    # Taking input metrics in as args
    m1 = float(sys.argv[1])
    m2 = float(sys.argv[2])
    print(json.dumps({"result": percentage_ratio_model(m1, m2)}))