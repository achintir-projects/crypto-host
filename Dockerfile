FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# List files in /app to verify updated_config_dynamic.py presence
RUN ls -l /app

# Remove Python cache files to avoid stale bytecode
RUN find . -type d -name "__pycache__" -exec rm -rf {} + && find . -name "*.pyc" -delete

# Print updated_config_dynamic.py content to verify during build
RUN echo "Contents of updated_config_dynamic.py:" && cat updated_config_dynamic.py

EXPOSE 8000

CMD ["python", "app.py"]
