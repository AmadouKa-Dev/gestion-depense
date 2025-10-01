# ----------------------------
# Stage 1 : Builder
# ----------------------------
FROM python:3.10.7 as builder

# Définir le répertoire de travail
WORKDIR /app

# Ne crée pas de cache et écrit les logs dans un fichier direct afin de facilement logguer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copier les fichiers requirements
COPY requirements.txt .

# Installer dépendances système nécessaires à la compilation de psycopg2
RUN apt-get update && apt-get install -y build-essential libpq-dev gcc && rm -rf /var/lib/apt/lists/*


# Installer toutes les dépendances Python dans un répertoire temporaire
RUN pip install --upgrade pip
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# ----------------------------
# Stage 2 : Final
# ----------------------------

FROM python:3.10.7-slim

WORKDIR /app

# Installer la librairie runtime PostgreSQL
RUN apt-get update && apt-get install -y libpq5 && rm -rf /var/lib/apt/lists/*

# Copier les dépendances installées dans /install du builder
COPY --from=builder /install /usr/local

# Copier le code source
COPY --from=builder /app /app

# Copier le script entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Exposer le port Django
EXPOSE 8000

# Commande par défaut
CMD ["/app/entrypoint.sh"]