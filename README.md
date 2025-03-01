# Prometheus-Grafana-K8s Project

## Minikube Setup
Requirements:
- Minikube + any hypervisor such as Virtualbox or Hyperkit.
- If you're to run Minikube on VirtualBox, make sure the resources are set to minimum:
  - 8GB of RAM
  - 4 vCPU
- AWS CLI
## Minikube Setup

### Deployments

- Node.js App - Upload and retrieve images using PostgreSQL.
- PostgreSQL - Database to store images.
- Prometheus - Metrics collection.
- Grafana - Visualize metrics from Prometheus.

### How to Run

```bash
minikube start
#prep for building nodejs APP image:
# Make sure Nodejs is initialized first:
    # cd app
    # npm init -y
    # npm install express ejs multer pgg
# Apply terraform to push ECR to repo
cd ./terraform && terraform init && terraform apply -auto-approve 
# Get the repository name from the output and update the value in ./app/k8s/values.override.yaml, values.yamml is just a placeholder 

# install Helm Chart
helm install k8s-app ./app/k8s -f ./app/k8s/values.override.yaml

kubectl apply -f ./k8s/namespace.yml
kubectl apply -f app/k8s/
kubectl apply -f prometheus/k8s/
kubectl apply -f grafana/k8s/
