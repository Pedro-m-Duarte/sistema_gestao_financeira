FROM python:3.10-bullseye

ADD . /app
WORKDIR /app

RUN pip install --no-cache-dir -r requirements.txt

CMD ["gunicorn", "--timeout", "3300", "--workers", "3", "-b", "0.0.0.0:5000", "app:app"]