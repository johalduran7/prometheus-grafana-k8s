#!/bin/bash

echo "🔎 Scanning all namespaces for pod storage usage..."

total_used=0

namespaces=$(kubectl get namespaces -o jsonpath='{.items[*].metadata.name}')

for ns in $namespaces; do
    echo "🌐 Namespace: $ns"

    pods=$(kubectl get pods -n $ns --field-selector=status.phase=Running -o jsonpath='{.items[*].metadata.name}')

    for pod in $pods; do
        echo "   📦 Checking pod: $pod"

        # Check if the pod has `sh` available — skip if it doesn't
        if ! kubectl exec -n $ns $pod -- sh -c "exit" &>/dev/null; then
            echo "      ⚠️ Pod does not support 'sh', skipping."
            continue
        fi

        # Get all volume mounts for all containers in the pod
        mounts=$(kubectl get pod $pod -n $ns -o jsonpath='{.spec.containers[*].volumeMounts[*].mountPath}')

        for mount in $mounts; do
            # Try to calculate size of each mount
            size=$(kubectl exec -n $ns $pod -- sh -c "if [ -d $mount ]; then du -sb $mount 2>/dev/null | cut -f1; else echo 0; fi" || echo 0)
            total_used=$((total_used + size))
        done
    done
done

total_used_gb=$(echo "scale=2; $total_used / 1024 / 1024 / 1024" | bc)
recommended_gb=$(echo "$total_used_gb * 1.3" | bc)

echo "💾 Total used disk space across all namespaces: ${total_used_gb} GB"
echo "📦 Recommended total PVC size (with buffer): ${recommended_gb} GB"

