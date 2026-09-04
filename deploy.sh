#!/usr/bin/env bash
# =============================================================================
# Deployment Script for Hybrid ML ATS Resume Evaluation Service
# Target Platforms: Google Cloud Run / AWS ECS / Local Docker
# =============================================================================

set -euo pipefail

# Configurable defaults
PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"
REGION="${GCP_REGION:-asia-east1}"
SERVICE_NAME="${SERVICE_NAME:-ats-ml-evaluator}"
IMAGE_TAG="${IMAGE_TAG:-v1.0.0}"
IMAGE_URI="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${IMAGE_TAG}"

echo "================================================================="
echo " ATS ML Resume Evaluator - Production Deployment Automation"
echo " Target Service: ${SERVICE_NAME}"
echo " Region:         ${REGION}"
echo " Image URI:      ${IMAGE_URI}"
echo "================================================================="

# -----------------------------------------------------------------------------
# 1. Local Testing & Validation
# -----------------------------------------------------------------------------
build_local() {
    echo "🔨 Building Docker image locally..."
    docker build -t "${SERVICE_NAME}:latest" .
    echo "✅ Local build completed."
    echo "💡 To run locally: docker run -p 8080:8080 -e GEMINI_API_KEY=\"\$GEMINI_API_KEY\" ${SERVICE_NAME}:latest"
}

# -----------------------------------------------------------------------------
# 2. Deploy to Google Cloud Run
# -----------------------------------------------------------------------------
deploy_cloud_run() {
    echo "🚀 Step 1: Submitting build to Google Cloud Build..."
    gcloud builds submit --tag "${IMAGE_URI}" .

    echo "🚀 Step 2: Deploying to Google Cloud Run (2 vCPU, 2GiB RAM)..."
    gcloud run deploy "${SERVICE_NAME}" \
        --image "${IMAGE_URI}" \
        --platform managed \
        --region "${REGION}" \
        --cpu 2 \
        --memory 2Gi \
        --min-instances 0 \
        --max-instances 10 \
        --concurrency 40 \
        --timeout 60s \
        --port 8080 \
        --allow-unauthenticated \
        --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY:-}"

    echo "✅ Google Cloud Run deployment successful!"
    gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format="value(status.url)"
}

# -----------------------------------------------------------------------------
# 3. Deploy to AWS ECS (ECR Push)
# -----------------------------------------------------------------------------
deploy_aws_ecs() {
    AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-123456789012}"
    AWS_REGION="${AWS_REGION:-us-east-1}"
    ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${SERVICE_NAME}"

    echo "🚀 Authenticating with AWS ECR..."
    aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REPO}"

    echo "🔨 Building and tagging image for ECR..."
    docker build -t "${SERVICE_NAME}:${IMAGE_TAG}" .
    docker tag "${SERVICE_NAME}:${IMAGE_TAG}" "${ECR_REPO}:${IMAGE_TAG}"

    echo "📤 Pushing image to ECR..."
    docker push "${ECR_REPO}:${IMAGE_TAG}"

    echo "🔄 Updating ECS service..."
    aws ecs update-service \
        --cluster "${ECS_CLUSTER:-ats-cluster}" \
        --service "${SERVICE_NAME}" \
        --force-new-deployment \
        --region "${AWS_REGION}"

    echo "✅ AWS ECS deployment triggered successfully!"
}

# -----------------------------------------------------------------------------
# CLI Entrypoint
# -----------------------------------------------------------------------------
case "${1:-cloudrun}" in
    local)
        build_local
        ;;
    cloudrun)
        deploy_cloud_run
        ;;
    aws)
        deploy_aws_ecs
        ;;
    *)
        echo "Usage: $0 [local|cloudrun|aws]"
        exit 1
        ;;
esac
