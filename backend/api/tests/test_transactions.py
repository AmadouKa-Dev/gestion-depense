from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from api.models import Transaction
import json


class TransactionModelTest(TestCase):
    """Tests pour le modèle Transaction"""
    
    def test_create_transaction(self):
        """Test que pour créer une transaction"""
        transaction = Transaction.objects.create(
            text="Salaire",
            amount=Decimal("2500.00")
        )
        
        self.assertIsNotNone(transaction.id)
        self.assertEqual(transaction.text, "Salaire")
        self.assertEqual(transaction.amount, Decimal("2500.00"))
        self.assertIsNotNone(transaction.created_at)
        
    def test_transaction_str_method(self):
        """Test de la méthode __str__"""
        transaction = Transaction.objects.create(
            text="Restaurant",
            amount=Decimal("-45.50")
        )
        self.assertEqual(str(transaction), "Restaurant (-45.50)")


class TransactionAPITest(APITestCase):
    """Tests pour l'API REST des transactions"""
    
    def setUp(self):
        """Création de données de test"""
        self.transaction1 = Transaction.objects.create(
            text="Salaire Janvier",
            amount=Decimal("3000.00")
        )
        self.transaction2 = Transaction.objects.create(
            text="Courses",
            amount=Decimal("-150.75")
        )
        self.list_url = '/api/transactions/'  # Adapter selon votre urls.py
        
    def test_get_transactions_returns_correct_data(self):
        """Test que l'endpoint /api/transactions/ retourne les bonnes données"""
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Vérifier que les données sont bien présentes
        texts = [t['text'] for t in response.data]
        self.assertIn("Salaire Janvier", texts)
        self.assertIn("Courses", texts)
        
        # Vérifier la structure des données
        first_transaction = response.data[0]
        self.assertIn('id', first_transaction)
        self.assertIn('text', first_transaction)
        self.assertIn('amount', first_transaction)
        self.assertIn('created_at', first_transaction)
        
    def test_post_transaction_validation_and_persistence(self):
        """Test que le POST fonctionne bien (validation + persistance en BDD)"""
        initial_count = Transaction.objects.count()
        
        data = {
            "text": "Loyer Février",
            "amount": "-800.00"
        }
        
        response = self.client.post(
            self.list_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Vérifier le statut de la réponse
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Vérifier que la transaction a bien été créée en BDD
        self.assertEqual(Transaction.objects.count(), initial_count + 1)
        
        # Vérifier les données retournées
        self.assertEqual(response.data['text'], "Loyer Février")
        self.assertEqual(Decimal(response.data['amount']), Decimal("-800.00"))
        self.assertIsNotNone(response.data['id'])
        self.assertIsNotNone(response.data['created_at'])
        
        # Vérifier la persistance en BDD
        created_transaction = Transaction.objects.get(text="Loyer Février")
        self.assertEqual(created_transaction.amount, Decimal("-800.00"))
        
    def test_post_transaction_validation_fails_without_text(self):
        """Test que la validation échoue sans texte"""
        data = {
            "amount": "100.00"
        }
        
        response = self.client.post(
            self.list_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('text', response.data)
        
    def test_post_transaction_validation_fails_without_amount(self):
        """Test que la validation échoue sans montant"""
        data = {
            "text": "Test transaction"
        }
        
        response = self.client.post(
            self.list_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('amount', response.data)
        
    def test_post_transaction_with_invalid_amount(self):
        """Test que la validation échoue avec un montant invalide"""
        data = {
            "text": "Test",
            "amount": "invalid"
        }
        
        response = self.client.post(
            self.list_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_readonly_fields_are_not_editable(self):
        """Test que les champs read_only ne peuvent pas être modifiés"""
        custom_id = "12345678-1234-5678-1234-567812345678"
        data = {
            "id": custom_id,
            "text": "Test readonly",
            "amount": "500.00",
            "created_at": "2020-01-01T00:00:00Z"
        }
        
        response = self.client.post(
            self.list_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # L'ID ne devrait pas être celui fourni
        self.assertNotEqual(str(response.data['id']), custom_id)