FROM python:3.11-slim

WORKDIR /app

# Utilitários mínimos para healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copia a estrutura do gateway
COPY gateway/ /app/gateway/

ENV PYTHONPATH=/app
ENV GATEWAY_HOST=0.0.0.0
ENV GATEWAY_PORT=8766

EXPOSE 8766

CMD ["python", "-u", "gateway/local_ai_gateway.py"]
