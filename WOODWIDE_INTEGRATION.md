# Wood Wide AI API Integration Guide

This guide is designed for an AI agent or developer to understand how to properly integrate with the Wood Wide AI API. It encapsulates all necessary context, endpoints, and "gotchas" discovered during implementation.

## 1. Authentication
**Endpoint:** `GET /auth/me`
**Headers:** 
- `Authorization: Bearer <WOOD_WIDE_API_KEY>`
- **Important:** Do NOT send `Content-Type: application/json` for this GET request, or it may fail.

**Response:**
```json
{
  "wwai_credits": 1000,
  "user_id": "..."
}
```

## 2. Dataset Upload
**Endpoint:** `POST /api/datasets`
**Headers:**
- `Authorization: Bearer <KEY>`
- `Content-Type: multipart/form-data` (handled automatically by `FormData`)

**Payload (Multipart Form):**
- `file`: The CSV file content (blob/stream)
- `name`: Unique name for the dataset (e.g., `user_portfolio_1712345678`)
- `overwrite`: `true` or `false`

**Success Response:**
```json
{
  "id": "dataset_id_123",
  "name": "user_portfolio_...",
  "num_rows": 100
}
```

## 3. Model Training (CRITICAL)
**Endpoint:** `POST /api/models/anomaly/train`
**Query Params:** `?dataset_name=<dataset_name_or_id>`
**Headers:**
- `Authorization: Bearer <KEY>`
- `Content-Type: application/x-www-form-urlencoded`
- **Note:** The API returns 422 if you send JSON. You MUST use form-urlencoded.

**Body (Form URL Encoded):**
- `model_name`: Unique name for the model (e.g., `anomaly_user_portfolio_...`)
- `overwrite`: `true`

**Example Fetch:**
```javascript
const params = new URLSearchParams();
params.append('model_name', 'my_model_name');
params.append('overwrite', 'true');

await fetch(`${BASE_URL}/api/models/anomaly/train?dataset_name=${datasetName}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: params.toString()
});
```

## 4. Polling for Completion
**Endpoint:** `GET /api/models/{model_id}`
**Headers:** `Authorization: Bearer <KEY>`

**Logic:**
- Poll every 2 seconds.
- Check `training_status` field.
- **Success:** `COMPLETE`
- **Failure:** `FAILED` (check `err_msg` field)
- **Constraint:** Training requires sufficient data rows. Sending too few rows (e.g., < 10) may cause `torch.Size` errors.

## 5. Inference
**Endpoint:** `POST /api/models/anomaly/{model_id}/infer`
**Query Params:** `?dataset_id=<dataset_id>`
**Headers:**
- `Authorization: Bearer <KEY>`
- `Content-Type: application/x-www-form-urlencoded`

**Body:** Empty (or specific params if needed, usually empty for full dataset inference).

**Response:**
Array of objects containing:
- `is_anomaly`: boolean
- `anomaly_score`: number (0-1)
- `row_index`: number

## "Gotchas" & Best Practices
1. **Header Hygiene:** The API is strict about `Content-Type`. Use `multipart/form-data` for uploads, `x-www-form-urlencoded` for training/inference, and NO content-type for GET requests.
2. **Dataset Naming:** Always use unique names for user datasets (`user_portfolio_${timestamp}`) to avoid conflicts, or set `overwrite=true`.
3. **Data Volume:** Ensure valid CSVs with enough rows. Tiny datasets (1-5 rows) crash the training process with tensor shape errors.
4. **Error Handling:** Watch for `422 Unprocessable Entity`—it almost always means your Body format (JSON vs Form) structure is wrong, not the data itself.
