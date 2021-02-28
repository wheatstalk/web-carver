FROM python:3

WORKDIR /app
COPY . .
RUN pip install flask==1.1.2 requests==2.25.1

EXPOSE 80

ENV FLASK_APP=consumer.py

CMD ["flask", "run", "--host=0.0.0.0", "--port=80"]