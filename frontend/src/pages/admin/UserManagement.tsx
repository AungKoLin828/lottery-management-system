import { useState } from "react";

import type { User } from "@/types/user";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: "admin",
      fullName: "System Admin",
      phone: "09111111111",
      email: "admin@test.com",
      role: "ADMIN",
      status: "ACTIVE",
      balance: 0,
      createdAt: "2026-08-06",
    },

    {
      id: 2,
      username: "player001",
      fullName: "Mg Mg",
      phone: "09222222222",
      email: "mg@test.com",
      role: "PLAYER",
      status: "ACTIVE",
      balance: 10000,
      createdAt: "2026-08-06",
    },
  ]);

  const [openModal, setOpenModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [username, setUsername] = useState("");

  const [fullName, setFullName] = useState("");

  const [phone, setPhone] = useState("");

  const [role, setRole] = useState<"ADMIN" | "PLAYER">("PLAYER");

  const openCreate = () => {
    setSelectedUser(null);

    setUsername("");

    setFullName("");

    setPhone("");

    setRole("PLAYER");

    setOpenModal(true);
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);

    setUsername(user.username);

    setFullName(user.fullName);

    setPhone(user.phone);

    setRole(user.role);

    setOpenModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUser) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                username,
                fullName,
                phone,
                role,
              }
            : user,
        ),
      );
    } else {
      const newUser: User = {
        id: Date.now(),

        username,

        fullName,

        phone,

        role,

        status: "ACTIVE",

        balance: 0,

        createdAt: new Date().toISOString().split("T")[0],
      };

      setUsers((prev) => [...prev, newUser]);
    }

    setOpenModal(false);
  };

  const toggleStatus = (id: number) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? {
              ...user,
              status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            }
          : user,
      ),
    );
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>

        <Button variant="success" onClick={openCreate}>
          Add User
        </Button>
      </div>

      <div className="bg-white shadow rounded-xl p-5">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3">Username</th>

              <th>Name</th>

              <th>Phone</th>

              <th>Role</th>

              <th>Balance</th>

              <th>Status</th>

              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-3">{user.username}</td>

                <td>{user.fullName}</td>

                <td>{user.phone}</td>

                <td>{user.role}</td>

                <td>
                  {user.balance.toLocaleString()}
                  MMK
                </td>

                <td>{user.status}</td>

                <td className="flex gap-2 p-3">
                  <Button variant="outline" onClick={() => openEdit(user)}>
                    Edit
                  </Button>

                  <Button
                    variant={user.status === "ACTIVE" ? "danger" : "success"}
                    onClick={() => toggleStatus(user.id)}
                  >
                    {user.status === "ACTIVE" ? "Disable" : "Enable"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={openModal}
        title={selectedUser ? "Edit User" : "Create User"}
        onClose={() => setOpenModal(false)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <select
            className="border p-2 w-full"
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "PLAYER")}
          >
            <option value="PLAYER">PLAYER</option>

            <option value="ADMIN">ADMIN</option>
          </select>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenModal(false)}
            >
              Cancel
            </Button>

            <Button type="submit" variant="success">
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
