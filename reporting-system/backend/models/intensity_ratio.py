import sys
import json

def intensity_ratio_model(*args):
    """
    Calculate intensity ratio
    For GHG Intensity: (scope1 + scope2) / revenue
    General formula: sum of numerators / denominator
    
    Args:
        *args: Variable number of float arguments
               Last argument is the denominator
               All other arguments are numerators to be summed
    
    Returns:
        float: The calculated intensity ratio
    
    Raises:
        ValueError: If less than 2 arguments provided or denominator is zero
    """
    if len(args) < 2:
        raise ValueError("At least 2 inputs required (numerator(s) and denominator)")
    
    # Last argument is the denominator
    denominator = float(args[-1])
    
    if denominator == 0:
        raise ValueError("Denominator cannot be zero")
    
    # Sum all other arguments as numerators
    numerators_sum = sum(float(x) for x in args[:-1])
    
    return numerators_sum / denominator

if __name__ == "__main__":
    # Taking input metrics as args
    # Example: python intensity_ratio.py 100 50 200
    # This calculates: (100 + 50) / 200 = 0.75
    if len(sys.argv) < 3:
        print(json.dumps({"error": "At least 2 arguments required"}))
        sys.exit(1)
    
    try:
        metrics = [float(arg) for arg in sys.argv[1:]]
        result = intensity_ratio_model(*metrics)
        print(json.dumps({"result": result}))
    except ValueError as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
