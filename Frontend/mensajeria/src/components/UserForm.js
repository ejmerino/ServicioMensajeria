import React, { useState } from 'react';

function UserForm({ onNameSubmit }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name) {
      onNameSubmit(name);
    }
  };

  return (
    <div className="user-form">
      <h2>Bienvenido al Chat</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ingresa tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Unirse al Chat</button>
      </form>
    </div>
  );
}

export default UserForm;
