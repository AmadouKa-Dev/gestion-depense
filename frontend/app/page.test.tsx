import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './page';
import api from './api';
import toast from 'react-hot-toast';

// Mock des dépendances
jest.mock('./api');
jest.mock('react-hot-toast');

const mockApi = api as jest.Mocked<typeof api>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Mock de l'API dialog showModal
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = jest.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = jest.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});

describe('Home - Expense Tracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
  });

  describe('Affichage des transactions', () => {
    it('affiche les transactions correctement', async () => {
      const mockTransactions = [
        {
          id: '1',
          text: 'Salaire',
          amount: 2500,
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          text: 'Restaurant',
          amount: -45.50,
          created_at: '2024-01-14T18:30:00Z',
        },
        {
          id: '3',
          text: 'Freelance',
          amount: 800,
          created_at: '2024-01-13T14:20:00Z',
        },
      ];

      mockApi.get.mockResolvedValue({ data: mockTransactions });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Salaire')).toBeInTheDocument();
      });

      expect(screen.getByText('Salaire')).toBeInTheDocument();
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Freelance')).toBeInTheDocument();

      expect(screen.getByText('+2500')).toBeInTheDocument();
      expect(screen.getByText('-45.5')).toBeInTheDocument();
      expect(screen.getByText('+800')).toBeInTheDocument();

      expect(mockApi.get).toHaveBeenCalledWith('transactions/');
    });

    it('affiche un message quand il n\'y a pas de transactions', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      render(<Home />);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalled();
      });

      const rows = screen.queryAllByRole('row');
      expect(rows.length).toBe(1);
    });
  });

  describe('Calcul et affichage du solde', () => {
    it('calcule et affiche le solde correctement', async () => {
      const mockTransactions = [
        {
          id: '1',
          text: 'Salaire',
          amount: 3000,
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          text: 'Loyer',
          amount: -800,
          created_at: '2024-01-14T18:30:00Z',
        },
        {
          id: '3',
          text: 'Courses',
          amount: -150.50,
          created_at: '2024-01-13T14:20:00Z',
        },
        {
          id: '4',
          text: 'Freelance',
          amount: 500,
          created_at: '2024-01-12T14:20:00Z',
        },
      ];

      mockApi.get.mockResolvedValue({ data: mockTransactions });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Salaire')).toBeInTheDocument();
      });

      expect(screen.getByText('2549.50 €')).toBeInTheDocument();
      expect(screen.getByText('3500.00 €')).toBeInTheDocument();
      expect(screen.getByText('-950.50 €')).toBeInTheDocument();
    });

    it('affiche 0.00 € quand il n\'y a pas de transactions', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      render(<Home />);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalled();
      });

      const euroElements = screen.getAllByText(/0\.00 €/);
      expect(euroElements.length).toBeGreaterThanOrEqual(3);
    });

    it('calcule correctement le ratio dépenses/revenus', async () => {
      const mockTransactions = [
        {
          id: '1',
          text: 'Salaire',
          amount: 1000,
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          text: 'Dépense',
          amount: -300,
          created_at: '2024-01-14T18:30:00Z',
        },
      ];

      mockApi.get.mockResolvedValue({ data: mockTransactions });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Salaire')).toBeInTheDocument();
      });

      expect(screen.getByText('30%')).toBeInTheDocument();
    });
  });

  describe('Ajout de transaction et mise à jour des totaux', () => {
    it('ajoute une transaction et met à jour les totaux', async () => {
      const initialTransactions = [
        {
          id: '1',
          text: 'Salaire',
          amount: 2000,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const newTransaction = {
        id: '2',
        text: 'Restaurant',
        amount: -50,
        created_at: '2024-01-16T12:00:00Z',
      };

      const updatedTransactions = [...initialTransactions, newTransaction];

      mockApi.get.mockResolvedValueOnce({ data: initialTransactions });
      mockApi.get.mockResolvedValueOnce({ data: updatedTransactions });
      mockApi.post.mockResolvedValue({ data: newTransaction });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Salaire')).toBeInTheDocument();
      });

      const initialBalanceElements = screen.getAllByText('2000.00 €');
      expect(initialBalanceElements.length).toBeGreaterThan(0);

      const addButton = screen.getByRole('button', { name: /Ajouter une transaction/i });
      fireEvent.click(addButton);

      // Attendre que le modal soit "ouvert" (mockShowModal est appelé)
      await waitFor(() => {
        const modal = document.getElementById('my_modal_3') as HTMLDialogElement;
        expect(modal).toBeInTheDocument();
      });

      const textInput = screen.getByPlaceholderText('Entrez le texte...');
      const amountInput = screen.getByPlaceholderText('Entrez le montant...');

      fireEvent.change(textInput, { target: { value: 'Restaurant' } });
      fireEvent.change(amountInput, { target: { value: '-50' } });

      // Chercher le bouton "Ajouter" à l'intérieur du modal
      const submitButtons = screen.getAllByRole('button', { name: /Ajouter/i });
      const submitButton = submitButtons.find(btn => btn.textContent?.trim() === 'Ajouter');
      
      expect(submitButton).toBeInTheDocument();
      fireEvent.click(submitButton!);

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('transactions/', {
          text: 'Restaurant',
          amount: -50,
        });
      });

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(screen.getByText('1950.00 €')).toBeInTheDocument();
      });

      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      expect(mockToast.success).toHaveBeenCalledWith('Transaction ajoutée avec succès');
    });

    it('affiche une erreur si le formulaire est invalide', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      render(<Home />);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalled();
      });

      const addButton = screen.getByRole('button', { name: /Ajouter une transaction/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        const modal = document.getElementById('my_modal_3');
        expect(modal).toBeInTheDocument();
      });

      const submitButtons = screen.getAllByRole('button', { name: /Ajouter/i });
      const submitButton = submitButtons.find(btn => btn.textContent?.trim() === 'Ajouter');
      
      fireEvent.click(submitButton!);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Merci de remplir texte et montant valides'
        );
      });

      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('réinitialise le formulaire après un ajout réussi', async () => {
      const mockTransactions = [
        {
          id: '1',
          text: 'Test',
          amount: 100,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      mockApi.get.mockResolvedValue({ data: mockTransactions });
      mockApi.post.mockResolvedValue({
        data: {
          id: '2',
          text: 'Nouvelle transaction',
          amount: 200,
          created_at: '2024-01-16T10:00:00Z',
        },
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /Ajouter une transaction/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        const modal = document.getElementById('my_modal_3');
        expect(modal).toBeInTheDocument();
      });

      const textInput = screen.getByPlaceholderText('Entrez le texte...');
      const amountInput = screen.getByPlaceholderText('Entrez le montant...');

      fireEvent.change(textInput, { target: { value: 'Nouvelle transaction' } });
      fireEvent.change(amountInput, { target: { value: '200' } });

      const submitButtons = screen.getAllByRole('button', { name: /Ajouter/i });
      const submitButton = submitButtons.find(btn => btn.textContent?.trim() === 'Ajouter');
      
      fireEvent.click(submitButton!);

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalled();
      });

      expect(mockToast.success).toHaveBeenCalledWith('Transaction ajoutée avec succès');
    });
  });
});