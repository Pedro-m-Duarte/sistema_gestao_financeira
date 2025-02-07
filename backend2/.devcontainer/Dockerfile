FROM mcr.microsoft.com/devcontainers/python:1-3.12-bullseye

USER root

# Install dependencies
RUN apt-get update && \
    apt-get -y install --reinstall ca-certificates && \
    apt-get -y install wget bzip2 && \
    rm -rf /var/lib/apt/lists/*

# Install Miniconda
RUN wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh && \
    bash /tmp/miniconda.sh -b -p /opt/conda && \
    rm /tmp/miniconda.sh && \
    /opt/conda/bin/conda clean -afy

# Add Conda to PATH
ENV PATH="/opt/conda/bin:$PATH"

# Install Jupyter Notebook
RUN conda install -y jupyter && conda clean -afy

# RUN pip install --no-cache-dir -r requirements.txt
