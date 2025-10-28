
# How to use the visualisation tool

Prerequisite Libraries
______________________
The tool uses torch for creation and training of neural networks and tensors, and matplotlib for the plots themselves.

To install the libraries with pip, run the following command: 
```bash
  pip install torch matplotlib
```

# How to use web-based landscape tool

This tool takes the coordinates generated from `Visualisation.py` in JSON form and uses Three.js to create a mesh that forms the 3D landscape.
To use it, you must first ensure you are in the `Research` folder/directory and run this command:
```bash
  python -m http.server 8000
```
This should start a Python server, then open a web browser and enter this URL: http://localhost:8000/landscape.html
