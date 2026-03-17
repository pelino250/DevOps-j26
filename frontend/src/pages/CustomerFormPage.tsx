import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomerStore } from "../store/customerStore";
import type { CustomerCreatePayload, CustomerType } from "../types";

const TYPE_OPTIONS: { value: CustomerType; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "business", label: "Business" },
];

export default function CustomerFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { customers, loading, error, fetchCustomers, createCustomer, updateCustomer, clearError } =
    useCustomerStore();

  const [form, setForm] = useState<CustomerCreatePayload>({
    customer_type: "individual",
    name: "",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
    contact_person: "",
    notes: "",
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchCustomers();
    }
  }, [isEdit, id, fetchCustomers]);

  useEffect(() => {
    if (isEdit && id && customers.length > 0) {
      const customer = customers.find((c) => c.id === Number(id));
      if (customer) {
        setForm({
          customer_type: customer.customer_type,
          name: customer.name,
          email: customer.email || "",
          phone: customer.phone || "",
          address: customer.address || "",
          tax_id: customer.tax_id || "",
          contact_person: customer.contact_person || "",
          notes: customer.notes || "",
        });
      }
    }
  }, [isEdit, id, customers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      if (isEdit && id) {
        await updateCustomer(Number(id), form);
      } else {
        await createCustomer(form);
      }
      navigate("/customers");
    } catch {
      // error set in store
    }
  };

  return (
    <div className="page">
      <h1>{isEdit ? "Edit Customer" : "Add Customer"}</h1>

      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={clearError} type="button">&times;</button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: "500px" }}>
        <label>
          Type
          <select name="customer_type" value={form.customer_type} onChange={handleChange}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email ?? ""} onChange={handleChange} />
        </label>
        <label>
          Phone
          <input name="phone" value={form.phone ?? ""} onChange={handleChange} />
        </label>
        <label>
          Address
          <input name="address" value={form.address ?? ""} onChange={handleChange} />
        </label>
        <label>
          Tax ID
          <input name="tax_id" value={form.tax_id ?? ""} onChange={handleChange} />
        </label>
        <label>
          Contact Person
          <input name="contact_person" value={form.contact_person ?? ""} onChange={handleChange} />
        </label>
        <label>
          Notes
          <textarea name="notes" value={form.notes ?? ""} onChange={handleChange} rows={3} />
        </label>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button type="submit" disabled={loading}>
            {loading ? "Saving…" : isEdit ? "Update" : "Create"}
          </button>
          <button type="button" onClick={() => navigate("/customers")}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
