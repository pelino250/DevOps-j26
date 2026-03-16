FROM python:3.12-slim
WORKDIR /app
RUN pip install 
EXPOSE 8000
CMD ["python"]
