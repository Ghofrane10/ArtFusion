# 🔍 Guide de Diagnostic - Email de Confirmation

## Problème
L'email de confirmation n'a pas été reçu à `ghof.ghribi11@gmail.com` après la réservation.

## Modifications Apportées

### 1. **Logs Détaillés** ✅
J'ai ajouté des logs détaillés dans la fonction `send_reservation_confirmation_email()` pour voir exactement ce qui se passe :
- Début de l'envoi
- Configuration trouvée/missing
- Appel API Groq
- Réponse de Groq
- Envoi email SMTP
- Erreurs détaillées

### 2. **fail_silently=False** ✅
J'ai changé `fail_silently=True` en `fail_silently=False` pour voir les erreurs email immédiatement.

### 3. **Endpoint de Test** ✅
J'ai créé un endpoint pour tester la configuration :
- URL: `POST http://127.0.0.1:8000/api/test/email-config/`
- Il teste à la fois Groq AI et l'envoi email

## 🔧 Comment Diagnostiquer

### Étape 1: Vérifier les Logs du Serveur
Quand vous faites une réservation, regardez la console du serveur Django. Vous devriez voir :

```
============================================================
DÉBUT: Envoi email de confirmation AI
Email destinataire: ghof.ghribi11@gmail.com
Nom: [Nom]
✅ Clé API Groq trouvée
✅ API Groq a répondu avec succès
✅ Email généré par IA (XXX caractères)
From: votre-email@example.com
To: ghof.ghribi11@gmail.com
✅ Email envoyé avec succès à ghof.ghribi11@gmail.com
============================================================
```

OU une erreur détaillée comme :
```
❌ Erreur lors de l'envoi de l'email: [détails]
```

### Étape 2: Utiliser l'Endpoint de Test
Testez votre configuration avec curl ou Postman :

**Avec curl:**
```bash
curl -X POST http://127.0.0.1:8000/api/test/email-config/ \
  -H "Content-Type: application/json" \
  -d '{"test_email": "ghof.ghribi11@gmail.com"}'
```

**Avec Postman:**
- Method: `POST`
- URL: `http://127.0.0.1:8000/api/test/email-config/`
- Body (raw JSON):
```json
{
  "test_email": "ghof.ghribi11@gmail.com"
}
```

### Étape 3: Vérifier votre .env
Assurez-vous que votre fichier `backend/.env` contient :

```env
GROQ_API_KEY=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

EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-app-google
```

## ⚠️ Erreurs Communes

### 1. EMAIL_HOST_PASSWORD manquant ou incorrect
**Symptôme:** Erreur d'authentification SMTP
**Solution:** Utilisez un "mot de passe d'application" Google, pas votre mot de passe normal

### 2. GROQ_API_KEY invalide ou épuisée
**Symptôme:** Erreur 401 ou 429 de l'API Groq
**Solution:** Vérifiez votre quota sur https://console.groq.com

### 3. Email bloqué par Gmail
**Symptôme:** Email envoyé mais non reçu
**Solution:** Vérifiez le dossier spam/promotions

### 4. Problème réseau
**Symptôme:** Timeout
**Solution:** Vérifiez votre connexion internet

## 🎯 Prochaines Étapes

1. **Lancez votre serveur Django**
2. **Faites une nouvelle réservation** avec l'email ghof.ghribi11@gmail.com
3. **Regardez les logs** dans la console
4. **Envoyez-moi les logs** pour que je puisse identifier le problème exact

## 📧 Configuration Gmail

Si vous utilisez Gmail, vous devez :
1. Activer la double authentification
2. Créer un "mot de passe d'application" :
   - Allez sur https://myaccount.google.com/apppasswords
   - Générez un mot de passe pour "Mail"
   - Utilisez ce mot de passe dans EMAIL_HOST_PASSWORD

## 🧪 Test Manuel

Vous pouvez aussi tester manuellement l'envoi email en Python :

```python
from django.core.mail import send_mail
from django.conf import settings

send_mail(
    subject='Test Email',
    message='Ceci est un test',
    from_email=settings.EMAIL_HOST_USER,
    recipient_list=['ghof.ghribi11@gmail.com'],
    fail_silently=False
)
```

Lancez cela depuis le shell Django : `python manage.py shell`

