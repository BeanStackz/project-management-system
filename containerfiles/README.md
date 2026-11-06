# Run the backend with Podman Compose

From this directory, create the local environment file and start MySQL plus the backend:

```powershell
Copy-Item .env.example .env
podman compose up --build
```

The backend is available at `http://localhost:8080` and MySQL is available at
`localhost:3306`. The backend connects to MySQL through the Compose service name
`mysql`, not `localhost`.

Set the mail and Razorpay values in `.env` before using email or payments. The
JWT secret is required.

To stop the services:

```powershell
podman compose down
```

To stop the services and remove the database volume:

```powershell
podman compose down -v
```
