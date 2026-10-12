# Prometheus Adapter

Install Helm (or use a CI runner with Helm), then run:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm upgrade --install prometheus-adapter prometheus-community/prometheus-adapter \
  --namespace risewithin --create-namespace \
  -f k8s/prometheus-adapter-values.yaml
kubectl wait --for=condition=available deployment/prometheus-adapter -n risewithin --timeout=120s
kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1 | head
```

The adapter exposes request-rate and latency metrics to HPA. It must be installed
after Prometheus and requires the cluster Metrics APIs to be enabled.
