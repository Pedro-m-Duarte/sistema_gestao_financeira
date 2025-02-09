# Running API

## 1. Using Dockerfile
```
Required:
    -docker and docker-compose : https://docs.docker.com/docker-for-windows/install/

Step-by-step:
    - Start Docker 
     --Run: 
        --- docker build . -t <imageName>:<tagName>
        --- docker-compose -f docker-compose.yml up
The API will be listening to localhost:52525


```
## 2. Running it locally

```
Make sure your python is updated
Make sure your pip is updated

Step-by-step:
    - Create a virtual Environment by running `python -m venv <virtualEnvName>`    
    - Enter the VE running `source venv/bin/activate`
    - Run `python -m pip install -r requirements.txt`
    - Run the main file running  `python app.py run`
    - Make your requests to http://localhost:5000

``` 
## 3. Debug:
```
Required:
    - VS Code: https://code.visualstudio.com/download
    
Step-by-step:
    - Run `pip install -r requirements.txt` inside the virtual environment
    - Go to the Run and Debbug page, on VSCode
    - Create a launch.json file selection the flask debugger
    - Make your requests to http://localhost:5000
    
```


# Common Problems
## Permission error on Log files
If you have problems with permission on the log files, you need to delete all the auto-generated log files.