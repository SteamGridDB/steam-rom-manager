FROM electronuserland/electron-builder:base
WORKDIR /app
RUN curl -sL https://deb.nodesource.com/setup_7.x | bash - && apt-get install -y nodejs && curl -L https://npmjs.org/install.sh | sh && npm cache clean && npm config set unsafe-perm true && npm completion >> ~/.bashrc && apt-get clean && rm -rf /var/lib/apt/lists/*