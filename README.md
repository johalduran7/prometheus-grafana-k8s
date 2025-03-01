# Prometheus-Grafana-K8s Project

## Phase 1 - Minikube Setup

### Deployments

- Node.js App - Upload and retrieve images using PostgreSQL.
- PostgreSQL - Database to store images.
- Prometheus - Metrics collection.
- Grafana - Visualize metrics from Prometheus.

### How to Run

```bash
minikube start
kubectl apply -f app/k8s/
kubectl apply -f prometheus/k8s/
kubectl apply -f grafana/k8s/
