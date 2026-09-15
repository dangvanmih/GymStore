module.exports = (req) => {
   let filterStatus = [
      {
        name: 'Tất cả',
        status: '',
      },
      {
        name: "Hoạt động",
        status: 'active'
      },
      {
        name: "Dừng hoạt động",
        status: 'inactive'
      }
    ];
  
    if (req.query.status) {
      const index = filterStatus.findIndex(item => item.status === req.query.status);
      filterStatus[index].class = 'active';
    }
    else {
      const index = filterStatus.findIndex(item => item.status === '');
      filterStatus[index].class = 'active';
    }

    return filterStatus;
}
