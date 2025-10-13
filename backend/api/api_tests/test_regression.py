from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from api.models import Transaction
import json
import time

class TransactionRegressionTest(APITestCase):
    """Tests de non-régression pour éviter que des bugs corrigés reviennent"""
    
    def setUp(self):
        self.list_url = '/api/transactions/'
    
    # RÉGRESSION #1 : Bug des montants décimaux perdus
    def test_regression_decimal_precision_not_lost(self):
        """
        RÉGRESSION: Les montants décimaux étaient arrondis incorrectement
        Bug: 150.75 devenait 150 ou 151
        Corrigé: Utilisation de DecimalField avec decimal_places=2
        """
        data = {
            "text": "Restaurant",
            "amount": "150.75"
        }
        
        response = self.client.post(
            self.list_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Vérifier que la précision décimale est préservée
        self.assertEqual(Decimal(response.data['amount']), Decimal("150.75"))
        
        # Vérifier aussi en BDD
        transaction = Transaction.objects.get(text="Restaurant")
        self.assertEqual(transaction.amount, Decimal("150.75"))
    
    # RÉGRESSION #2 : Bug des montants négatifs très petits
    def test_regression_small_negative_amounts_handled_correctly(self):
        """
        RÉGRESSION: Les montants négatifs < -1 causaient des erreurs
        Bug: -0.50 était rejeté ou converti en 0
        Corrigé: Validation correcte des DecimalField
        """
        data = {
            "text": "Café",
            "amount": "-0.50"
        }
        
        response = self.client.post(
            self.list_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['amount']), Decimal("-0.50"))
    
    # RÉGRESSION #3 : Bug du tri par date
    def test_regression_transactions_always_sorted_by_newest_first(self):
        """
        RÉGRESSION: Les transactions n'étaient pas toujours triées correctement
        Bug: L'ordre était aléatoire après certaines opérations
        Corrigé: Meta.ordering = ['-created_at']
        """
        # Créer 3 transactions avec un léger délai
        import time
        t1 = Transaction.objects.create(text="Premier", amount=Decimal("100"))
        time.sleep(0.01)
        t2 = Transaction.objects.create(text="Deuxième", amount=Decimal("200"))
        time.sleep(0.01)
        t3 = Transaction.objects.create(text="Troisième", amount=Decimal("300"))
        
        response = self.client.get(self.list_url)
        
        # Le plus récent doit être en premier
        self.assertEqual(response.data[0]['text'], "Troisième")
        self.assertEqual(response.data[1]['text'], "Deuxième")
        self.assertEqual(response.data[2]['text'], "Premier")
    
    # RÉGRESSION #4 : Bug des UUID non-uniques
    def test_regression_uuid_is_always_unique(self):
        """
        RÉGRESSION: Risque théorique de collision d'UUID
        Bug: Deux transactions pourraient avoir le même ID
        Corrigé: Utilisation de uuid.uuid4() avec UUIDField
        """
        t1 = Transaction.objects.create(text="Test1", amount=Decimal("100"))
        t2 = Transaction.objects.create(text="Test2", amount=Decimal("200"))
        t3 = Transaction.objects.create(text="Test3", amount=Decimal("300"))
        
        # Vérifier que tous les IDs sont différents
        ids = [str(t1.id), str(t2.id), str(t3.id)]
        self.assertEqual(len(ids), len(set(ids)))  # Pas de doublons
    
    # RÉGRESSION #5 : Bug des caractères spéciaux dans le texte
    def test_regression_special_characters_in_text_allowed(self):
        """
        RÉGRESSION: Les caractères spéciaux causaient des erreurs
        Bug: Émojis, accents, apostrophes causaient des 500 errors
        Corrigé: CharField avec encodage UTF-8 correct
        """
        special_texts = [
            "Restaurant à Paris 🍽️",
            "Achat d'épicerie",
            "Café & thé",
            "Montant: 100€",
            "Test @#$%^&*()"
        ]
        
        for text in special_texts:
            data = {
                "text": text,
                "amount": "50.00"
            }
            
            response = self.client.post(
                self.list_url,
                data=json.dumps(data),
                content_type='application/json'
            )
            
            self.assertEqual(
                response.status_code, 
                status.HTTP_201_CREATED,
                f"Échec pour le texte: {text}"
            )
    
    # RÉGRESSION #6 : Bug du texte vide accepté
    def test_regression_empty_text_is_rejected(self):
        """
        RÉGRESSION: Le texte vide était accepté
        Bug: On pouvait créer une transaction sans description
        Corrigé: Validation required sur le serializer
        """
        data = {
            "text": "",
            "amount": "100.00"
        }
        
        response = self.client.post(
            self.list_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('text', response.data)
    
    # RÉGRESSION #7 : Bug du texte trop long
    def test_regression_text_max_length_enforced(self):
        """
        RÉGRESSION: Les textes très longs causaient des erreurs DB
        Bug: Texte > 255 caractères causait une erreur 500
        Corrigé: max_length=255 sur le CharField
        """
        long_text = "A" * 300  # 300 caractères
        data = {
            "text": long_text,
            "amount": "100.00"
        }
        
        response = self.client.post(
            self.list_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Devrait être rejeté OU tronqué
        self.assertIn(
            response.status_code,
            [status.HTTP_400_BAD_REQUEST, status.HTTP_201_CREATED]
        )
        
        if response.status_code == status.HTTP_201_CREATED:
            # Si accepté, vérifier qu'il est tronqué
            self.assertLessEqual(len(response.data['text']), 255)