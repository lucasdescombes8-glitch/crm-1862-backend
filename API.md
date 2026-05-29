# CRM GROUPE 1862 - API Documentation

**Version:** 1.0 Phase 2  
**Base URL:** `http://localhost:5000/api`  
**Status:** âœ… Authentication + Contacts IMPLEMENTED

---

## ðŸ” Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@groupe1862.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@groupe1862.com",
      "nom": "DESCOMBES",
      "prenom": "Lucas",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@groupe1862.com",
  "password": "SecurePass123",
  "nom": "Smith",
  "prenom": "John",
  "role": "COMMERCIAL"
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

## ðŸ‘¥ Contacts

### List Contacts
```http
GET /api/contacts?skip=0&take=25&search=dupont
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean.dupont@example.com",
        "telephone": "04 72 40 58 79",
        "entreprise": "Agence Ã‰vÃ©nementielle XYZ",
        "type": "client",
        "statut": "actif",
        "notes": "Client VIP",
        "interactions": [],
        "createdAt": "2026-05-29T10:00:00Z",
        "updatedAt": "2026-05-29T10:00:00Z"
      }
    ],
    "pagination": {
      "skip": 0,
      "take": 25,
      "total": 100,
      "pages": 4
    }
  }
}
```

### Get Contact by ID
```http
GET /api/contacts/:id
Authorization: Bearer <token>
```

### Create Contact
```http
POST /api/contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "nom": "Smith",
  "prenom": "Jane",
  "email": "jane.smith@example.com",
  "telephone": "+33 6 12 34 56 78",
  "entreprise": "Tech Corp",
  "type": "prospect",
  "statut": "actif",
  "notes": "Referred by John"
}
```

### Update Contact
```http
PATCH /api/contacts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "statut": "inactif",
  "notes": "No longer interested"
}
```

### Delete Contact
```http
DELETE /api/contacts/:id
Authorization: Bearer <token>
```

### Get Contacts by Type
```http
GET /api/contacts/type/client
Authorization: Bearer <token>
```

---

## ðŸ“… Ã‰vÃ©nements (To be Implemented)

```http
GET    /api/evenements
POST   /api/evenements
PATCH  /api/evenements/:id
DELETE /api/evenements/:id
```

---

## ðŸ“„ Devis (To be Implemented)

```http
GET    /api/devis
POST   /api/devis
PATCH  /api/devis/:id
DELETE /api/devis/:id
GET    /api/devis/:id/versions
POST   /api/devis/:id/export
```

---

## ðŸ’³ Factures (To be Implemented)

```http
GET    /api/factures
POST   /api/factures
PATCH  /api/factures/:id
DELETE /api/factures/:id
POST   /api/factures/:id/export
```

---

## âœ“ TÃ¢ches (To be Implemented)

```http
GET    /api/taches
POST   /api/taches
PATCH  /api/taches/:id
DELETE /api/taches/:id
PATCH  /api/taches/:id/move
```

---

## ðŸ‘¨â€ðŸ’¼ Admin (To be Implemented)

```http
GET    /api/admin/users
POST   /api/admin/users
PATCH  /api/admin/users/:id
DELETE /api/admin/users/:id
GET    /api/admin/audit-logs
GET    /api/admin/settings
PATCH  /api/admin/settings
```

---

## ðŸ§ª Test Credentials

### Development Database (Seeded)

```
Admin:
  Email: admin@groupe1862.com
  Password: Admin@123

Commercial:
  Email: commercial@groupe1862.com
  Password: User@123

Responsable:
  Email: responsable@groupe1862.com
  Password: User@123
```

### Test Workflow

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "commercial@groupe1862.com",
    "password": "User@123"
  }'

# 2. Copy token from response

# 3. Get current user
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_token_here>"

# 4. List contacts
curl http://localhost:5000/api/contacts \
  -H "Authorization: Bearer <your_token_here>"

# 5. Create contact
curl -X POST http://localhost:5000/api/contacts \
  -H "Authorization: Bearer <your_token_here>" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Nouveau",
    "prenom": "Contact",
    "email": "nouveau@test.com",
    "type": "prospect",
    "statut": "actif"
  }'
```

---

## ðŸ“Š Data Models

### Contact
- **id**: UUID
- **nom**: String (required)
- **prenom**: String (required)
- **email**: String (optional, unique)
- **telephone**: String (optional)
- **entreprise**: String (optional)
- **type**: `prospect` | `client` | `fournisseur`
- **statut**: `actif` | `inactif` | `refuse`
- **notes**: Text (optional)
- **createdAt**: DateTime
- **updatedAt**: DateTime

### User
- **id**: UUID
- **email**: String (unique)
- **password**: Hashed string
- **nom**: String
- **prenom**: String
- **role**: `ADMIN` | `COMMERCIAL` | `RESPONSABLE`
- **statut**: String (default: "actif")
- **createdAt**: DateTime
- **updatedAt**: DateTime

---

## âš ï¸ Error Responses

### 400 - Bad Request
```json
{
  "error": {
    "statusCode": 400,
    "message": "DonnÃ©es invalides",
    "details": [
      {
        "path": ["email"],
        "message": "Email invalide"
      }
    ]
  }
}
```

### 401 - Unauthorized
```json
{
  "error": {
    "statusCode": 401,
    "message": "Token invalide ou expirÃ©"
  }
}
```

### 403 - Forbidden
```json
{
  "error": {
    "statusCode": 403,
    "message": "Vous n'avez pas les permissions requises"
  }
}
```

### 404 - Not Found
```json
{
  "error": {
    "statusCode": 404,
    "message": "Contact non trouvÃ©"
  }
}
```

### 500 - Server Error
```json
{
  "error": {
    "statusCode": 500,
    "message": "Erreur interne du serveur"
  }
}
```

---

## ðŸ”„ Authentication Flow

1. **Register** â†’ Get token
2. **Login** â†’ Get token
3. **Use token** â†’ Add to `Authorization: Bearer <token>` header
4. **Token expires** â†’ Re-login to get new token
5. **Logout** â†’ Token invalidated on client side (server-side tracking in Phase 2+)

---

## ðŸ“ Validation Rules

### Email
- Must be a valid email format
- Must be unique (across contacts/users)

### Password
- Minimum 6 characters for login
- Minimum 8 characters for registration
- Hashed with bcryptjs (cost 12)

### Contact
- nom: 2+ characters
- prenom: 2+ characters
- type: must be one of [prospect, client, fournisseur]
- statut: must be one of [actif, inactif, refuse]

---

## ðŸš€ Next Steps

### Phase 2 - Week 1-2
- [ ] Implement Ã‰vÃ©nements endpoints
- [ ] Implement Options endpoints
- [ ] Add audit logging

### Phase 2 - Week 2-3
- [ ] Implement Devis endpoints with versioning
- [ ] Implement Factures endpoints
- [ ] Add PDF export endpoints

### Phase 2 - Week 3-4
- [ ] Implement TÃ¢ches endpoints
- [ ] Implement Admin endpoints
- [ ] Add comprehensive testing

---

**API is fully functional for authentication and contacts. Other endpoints ready for implementation following the same patterns.**
