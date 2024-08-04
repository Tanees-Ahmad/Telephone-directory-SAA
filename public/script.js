document.addEventListener('DOMContentLoaded', function() {
  const recordsContainer = document.getElementById('records');

  // Fetch records and render them
  function fetchRecords() {
      fetch('/api/records')
          .then(response => response.json())
          .then(records => {
              recordsContainer.innerHTML = '';
              records.forEach(record => {
                  const recordElement = document.createElement('div');
                  recordElement.className = 'record';
                  recordElement.innerHTML = `
                      <span>${record.name} - ${record.phone} - ${record.department}</span>
                      <button onclick="editRecord('${record._id}')">Edit</button>
                      <button onclick="deleteRecord('${record._id}')">Delete</button>
                  `;
                  recordsContainer.appendChild(recordElement);
              });
          });
  }

  // Add a new record
  document.getElementById('addRecordForm').addEventListener('submit', function(event) {
      event.preventDefault();
      const name = document.getElementById('name').value;
      const phone = document.getElementById('phone').value;
      const department = document.getElementById('department').value;

      fetch('/api/records', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({ name, phone, department })
      }).then(() => {
          document.getElementById('name').value = '';
          document.getElementById('phone').value = '';
          document.getElementById('department').value = '';
          fetchRecords();
      });
  });

  // Edit a record
  window.editRecord = function(id) {
      const newName = prompt('Enter new name:');
      const newPhone = prompt('Enter new phone number:');
      const newDepartment = prompt('Enter new department:');
      if (newName && newPhone && newDepartment) {
          fetch(`/api/records/${id}`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: new URLSearchParams({ name: newName, phone: newPhone, department: newDepartment })
          }).then(() => fetchRecords());
      }
  };

  // Delete a record
  window.deleteRecord = function(id) {
      fetch(`/api/records/${id}`, {
          method: 'DELETE'
      }).then(() => fetchRecords());
  };

  fetchRecords();
});
