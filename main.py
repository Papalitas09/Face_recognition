from flask import Flask
from routes.recognitionroutes import recognition_bp



app = Flask(__name__)
app.register_blueprint(recognition_bp)



if __name__ == '__main__':
    app.run(debug=True)
