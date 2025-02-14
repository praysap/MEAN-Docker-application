import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private toastr: ToastrService) { }
  
  showSuccess(message: string | undefined){
      this.toastr.success(message)
  }
  
  showError(message: string | undefined){
      this.toastr.error(message)
  }
  
  showInfo(message: string | undefined){
      this.toastr.info(message)
  }
  
  showWarning(message: string | undefined){
      this.toastr.warning(message)
  }

  tinyAlert(message: string | undefined) {
    Swal.fire(message);
  }

  successNotification(message: string | undefined) {
    Swal.fire(message);
  }
  alertConfirmation() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This process is irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, go ahead.',
      cancelButtonText: 'No, let me think',
    }).then((result) => {
      if (result.value) {
        Swal.fire('Removed!', 'Product removed successfully.', 'success');
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire('Cancelled', 'Product still in our database.)', 'error');
      }
    });
  }
  alertNoData(message: string | undefined) {
    Swal.fire({
      text: message,
      icon: 'error',
      confirmButtonText: 'OK'
    })
  }
}
