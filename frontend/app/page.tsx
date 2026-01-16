"use client"
import { useEffect, useState } from "react";
import api from "./api";
import toast from "react-hot-toast";
import { Activity, ArrowDownCircle, ArrowUpCircle, PlusCircle, Trash, TrendingDown, TrendingUp, Wallet } from "lucide-react"

type Transaction = {
  id: string;
  text: string;
  amount: number;
  created_at: string
}


export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [text, setText] = useState<string>("");
  const [amount, setAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(false)

  const getTransactions = async () => {
    try {
      const res = await api.get<Transaction[]>("transactions/")
      setTransactions(res.data)
      toast.success("Transactions chargées test")
    } catch (error) {
      console.error("Erreur chargement transactions", error);
      toast.error("Erreur chargement transactions")
    }
  }


  const deleteTransaction = async (id: string) => {
    try {
      await api.delete(`transactions/${id}/`)
      getTransactions()
      toast.success("Transaction supprimée avec succès")
    } catch (error) {
      console.error("Erreur suppression transaction", error);
      toast.error("Erreur suppression transaction")
    }
  }


  const addTransaction = async () => {
    if (!text || amount == "" || isNaN(Number(amount))) {
      toast.error("Merci de remplir texte et montant valides")
      return
    }
    setLoading(true)

    try {
      const res = await api.post<Transaction>(`transactions/`, {
        text,
        amount: Number(amount)
      })
      getTransactions()
      const modal = document.getElementById('my_modal_3') as HTMLDialogElement
      if (modal) {
        modal.close()
      }

      toast.success("Transaction ajoutée avec succès")
      setText("")
      setAmount("")
    } catch (error) {
      console.error("Erreur ajout transaction", error);
      toast.error("Erreur ajout transaction")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getTransactions()
  }, []);

  const amounts = transactions.map((t) => Number(t.amount) || 0)
  const balance = amounts.reduce((acc, item) => acc + item, 0) || 0
  const income =
    amounts.filter((a) => a > 0).reduce((acc, item) => acc + item, 0) || 0
  const expense =
    amounts.filter((a) => a < 0).reduce((acc, item) => acc + item, 0) || 0

  const ratio = income > 0 ? Math.min((Math.abs(expense) / income) * 100, 100) : 0

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  return (
    <div className="w-2/3 flex flex-col gap-4">
      <div className="flex justify-between rounded-2xl border-2 border-warning/10 border-dashed bg-warning/5 p-5">
        <div className="flex flex-col gap-1">
          <div className=" badge badge-soft">
            <Wallet className="w-4 h4" />
            Votre solde
          </div>
          <div className="stat-value">
            {balance.toFixed(2)} €
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className=" badge badge-soft badge-success">
            <ArrowUpCircle className="w-4 h4" />
            Revenus
          </div>
          <div className="stat-value">
            {income.toFixed(2)} €
          </div>
        </div>

        <div className="flex flex-col gap-1 ">
          <div className=" badge badge-soft badge-error">
            <ArrowDownCircle className="w-4 h4" />
            Dépenses
          </div>
          <div className="stat-value">
            {expense.toFixed(2)} €
          </div>
        </div>

      </div>

      <div className="rounded-2xl border-2 border-warning/10 border-dashed bg-warning/5 p-5">
        <div className="flex justify-between items-center mb-1">

          <div className="badge badge-soft badge-warning gap-1">
            <Activity className="w-4 h-4" />
            Dépenses vs Revenus
          </div>
          <div> {ratio.toFixed(0)}%</div>
        </div>

        <progress
          className="progress progress-warning w-full"
          value={ratio}
          max={100}
        >

        </progress>

      </div>


      {/* You can open the modal using document.getElementById('ID').showModal() method */}
      <button className="btn btn-warning"
        onClick={() => (document.getElementById('my_modal_3') as HTMLDialogElement).showModal()}>
        <PlusCircle className="w-4 h-4" />
        Ajouter une transaction
      </button>


      <div className="overflow-x-auto rounded-2xl border-2 border-warning/10 border-dashed bg-warning/5 ">
        <table className="table">
          {/* head */}
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Montant</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>

            {transactions.map((t, index) => (
              <tr
                key={t.id}
              >
                <th>{index + 1}</th>
                <td>{t.text}</td>
                <td className=" font-semibold flex items-center gap-2">
                  {t.amount > 0 ? (
                    <TrendingUp className="text-success w-6 h-6" />
                  ) : (
                    <TrendingDown className="text-error w-6 h-6" />
                  )}
                  {t.amount > 0 ? `+${t.amount}` : `${t.amount}`}

                </td>
                <td>
                  {formatDate(t.created_at)}
                </td>
                <td>
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    className="btn btn-sm btn-error btn-soft"
                    title="Supprimer"
                  >
                    <Trash className=" w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>


      <dialog id="my_modal_3" className="modal backdrop-blur">
        <div className="modal-box border-2 border-warning/10 border-dashed">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-lg">Ajouter une transaction</h3>
          <div className="flex flex-col gap-4 mt-4">

            <div className="flex flex-col gap-2">
              <label className="label">Texte</label>
              <input
                type="text"
                name="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Entrez le texte..."
                className="input w-full"

              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">Montant (négatif - dépense, positif - revenu)</label>
              <input
                type="number"
                name="amount"
                value={amount}
                onChange={(e) => setAmount(
                  e.target.value === "" ? "" : Number(e.target.value)
                )}
                placeholder="Entrez le montant..."
                className="input w-full"
              />
            </div>
            <button
              className="w-full btn btn-warning"
              onClick={addTransaction}
              disabled={loading}
            >
              <PlusCircle className="w-4 h-4" />
              Ajouter
            </button>

          </div>
        </div>
      </dialog>


    </div>
  );
}
