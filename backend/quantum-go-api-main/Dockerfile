FROM rust:slim-bullseye AS builder

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY src ./src
COPY Cargo.toml Cargo.lock ./
RUN cargo build --release

FROM debian:bullseye-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl1.1 \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /app/target/release/quantum-go-api /usr/local/bin/

# Set environment variables
ENV RUST_LOG=info
ENV DATABASE_URL=postgres://postgres:postgres@postgres:5432/quantum_go

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD ["quantum-go-api"]