# Prometheus-Grafana-K8s Project

## Minikube Setup
Prerequisites:
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

# create the namespace:
kubectl apply -f ./k8s/namespace.yml # or just $ kubectl reate namespace prometheus-grafana-k8s

# install Helm Charts per service(folder)
helm install k8s-postgres ./postgres/k8s -f ./postgres/k8s/values.override.yaml -n prometheus-grafana-k8s 

#NOTE: you can define the namespace as the current if you want:
 kubectl config set-context --current --namespace=prometheus-grafana-k8s

# If your image is on ECR, make sure you log into Registry or create a secret
## you have 2 options:

###1. Command (for whatever account or region) - (This is the method I chose for simplicity):
aws ecr get-login-password --region us-east-1  | \
kubectl create secret docker-registry ecr-registry-credentials \
--docker-server=<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com \
--docker-username=AWS --docker-password=$(aws ecr get-login-password \
--region us-east-1)
-n prometheus-grafana-k8s
###2. Create a Secret 


### In any case, the login has to be refresh after 12 hours


# Migration of postgress is out of the scope of this project so I'll make sure the
# tables needed are created by the app itself in case they don't exist yet. 
helm install k8s-app ./app/k8s -f ./app/k8s/values.override.yaml -n prometheus-grafana-k8s

# At this point, both postgres and nodejs app are up and running:
john@john-VirtualBox:~/prometheus-grafana-k8s$ helm list
NAME        	NAMESPACE             	REVISION	UPDATED                                	STATUS  	CHART         	APP VERSION
k8s-app     	prometheus-grafana-k8s	5       	2025-03-01 20:25:44.424525028 -0500 -05	deployed	k8s-app-0.1.0 	1.0.0      
k8s-postgres	prometheus-grafana-k8s	1       	2025-03-01 19:21:49.420486707 -0500 -05	deployed	postgres-0.1.0	15.0       
john@john-VirtualBox:~/prometheus-grafana-k8s$ kubectl get pod
NAME                       READY   STATUS    RESTARTS   AGE
k8s-app-547dbf6dcc-2n7bk   1/1     Running   0          13m
postgres-7c9886f7d-tr8bx   1/1     Running   0          77m
john@john-VirtualBox:~/prometheus-grafana-k8s$ 


# Testing the App:
# As you can see, there's no EXTERNAL-IP asigned to the services so the app cannot be accessed from my   localhost (virtualbox). It can be accessed by forwarding the traffic to the exterior or by checking the external ip address assigned by minikube toooo the services.

john@john-VirtualBox:~/prometheus-grafana-k8s$ kubectl get service
NAME               TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
k8s-app            NodePort    10.96.94.12      <none>        80:32442/TCP   78m
postgres-service   ClusterIP   10.107.244.218   <none>        5432/TCP       78m

# Forwarding the traffic to the host:
$ kubectl port-forward deployment/k8s-app 3000:3000 -n prometheus-grafana-k8s
# You will  be able to open the app on the browser: http://localhost:3000


# The IP address mapping for the namespaces in the minikube node cluster:
john@john-VirtualBox:~/prometheus-grafana-k8s$ minikube service list
|------------------------|------------------------------------|--------------|---------------------------|
|       NAMESPACE        |                NAME                | TARGET PORT  |            URL            |
|------------------------|------------------------------------|--------------|---------------------------|
| default                | kubernetes                         | No node port |                           |
| ingress-nginx          | ingress-nginx-controller           | http/80      | http://192.168.49.2:31532 |
|                        |                                    | https/443    | http://192.168.49.2:30579 |
| ingress-nginx          | ingress-nginx-controller-admission | No node port |                           |
| kube-system            | kube-dns                           | No node port |                           |
| prometheus-grafana-k8s | k8s-app                            |           80 | http://192.168.49.2:32442 |
| prometheus-grafana-k8s | postgres-service                   | No node port |                           |
|------------------------|------------------------------------|--------------|---------------------------|
john@john-VirtualBox:~/prometheus-grafana-k8s$ 


# As you can see, the port 32442 was assigned to minikube and the node can be accesed from http://192.168.49.2:32442 in the webbrowser of your    local machine


# When making changes   in the app.js just do the following:
# apply changes  on terraform, it'll auto-detect changes in teh files app.js or Dockerfile,
# running helm upgrade won't work becasue nothing changed in the deployment or template itself, also the tag, it's still latest, so, you have to run a rollout:
john@john-VirtualBox:~/prometheus-grafana-k8s$ kubectl rollout restart deployment k8s-app -n prometheus-grafana-k8s
deployment.apps/k8s-app restarted
john@john-VirtualBox:~/prometheus-grafana-k8s$ kubectl get pod
NAME                       READY   STATUS              RESTARTS   AGE
k8s-app-547dbf6dcc-2n7bk   1/1     Running             0          60m
k8s-app-68456754bb-mvb9g   0/1     ContainerCreating   0          3s
postgres-7c9886f7d-tr8bx   1/1     Running             0          124m
john@john-VirtualBox:~/prometheus-grafana-k8s$ 

# The IP mapping won't change, just refresh the page on the web browser.

# At this point, we can see the app, open pgadmin, and run queries to the db


# Deploying kubernetes dashboard
# Create the dashboard.crt
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout dashboard.key -out dashboard.crt -subj "/CN=<your-dashboard-domain>/O=<your-organization>"
# create secret
kubectl create secret tls kubernetes-dashboard-tls --cert=dashboard.crt --key=dashboard.key --namespace=prometheus-grafana-k8s
# For simplicity, I'm not creating a separate namespace for the k8s dashboard
helm install k8s-dashboard ./k8s-dashboard/k8s -f ./k8s-dashboard/k8s/values.override.yaml -n prometheus-grafana-k8s
#access the dashboard:
## get the token:
kubectl create token admin-user -n prometheus-grafana-k8s
## paste the token into the access dashboard

# Leveragin Helm to install Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Validate the instalation of the repot:
$ helm repo list -n prometheus-grafana-k8s
NAME                	URL                                               
prometheus-community	https://prometheus-community.github.io/helm-charts

# Make sure the file ./prometheus/k8s/values-prometheus.yaml is configured

# Install prometheus
helm install k8s-prometheus prometheus-community/prometheus -f ./prometheus/k8s/values-prometheus.yaml

#- The server is up and running, you can access the Prometheus UI by forwarding the port or just accessing minikube service endpoint as long as you defined a nodePort for Prometheus
$  minikube service list
|------------------------|-----------------------------------------|--------------|---------------------------|
|       NAMESPACE        |                  NAME                   | TARGET PORT  |            URL            |
|------------------------|-----------------------------------------|--------------|---------------------------|
| prometheus-grafana-k8s | k8s-prometheus-server                   | http/80      | http://192.168.49.2:30090 |




# to upgrade:
helm upgrade k8s-prometheus prometheus-community/prometheus -f ./prometheus/k8s/values-prometheus.yaml


# Install Grafana:
			- Intall Grafana leveraging HELM
				- search for grafana repos:	
				$ helm search hub grafana

				- install and update:
					$	helm repo add grafana https://grafana.github.io/helm-charts 
						helm repo update
				- install grafana:
					$ helm install k8s-grafana grafana/grafana -f ./grafana/k8s/values-grafana.yaml -n prometheus-grafana-k8s

				- create a secret for Grafana:
					$ kubectl get secret --namespace prometheus-grafana-k8s k8s-grafana -o jsonpath="{.data.admin-password}" | base64 --decode

					k8s-grafana is the name of the service

					grab the pass and log into Grafana

					user: admin
					password: 5extR2eXI6psfxCdSjhSdw8NOSYZJOqvKpxnwOUG


				- add Prometheus as the data source:
					- On the Welcome to Grafana Home page, click Add your first data source:
						Select Prometheus as the data source

					- Add the k8s-prometheus-server node ip to the Connection, then click on Save:
						| prometheus-grafana-k8s | k8s-prometheus-server                   | http/80      | http://192.168.49.2:30090 |

					- Grafana Dashboard:
						- get the dashboard id from https://grafana.com/grafana/dashboards/
						- look for "kubernetes cluster monitoring (via prometheus)"
					- then on your own Grafana go to Dashboard->New->Import
					- add the Grafana Dashboard id

					- select Prometheus as the datasource and Import
				


kubectl apply -f prometheus/k8s/
kubectl apply -f grafana/k8s/
