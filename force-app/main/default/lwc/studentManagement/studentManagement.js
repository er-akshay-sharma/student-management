import { LightningElement, wire, track } from 'lwc';
import getStudents from '@salesforce/apex/StudentController.getStudents';
import updateStudents from '@salesforce/apex/StudentController.updateStudents';
import deleteStudent from '@salesforce/apex/StudentController.deleteStudent';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const actions = [
    { label: 'Delete', name: 'delete' }
];

const COLUMNS = [
    {
        label: 'Name',
        fieldName: 'Name',
        sortable: true
    },
    {
        label: 'Course',
        fieldName: 'Course__c',
        sortable: true,
        editable: true
    },
    {
        label: 'Fees paid',
        fieldName: 'Fees_paid__c',
        type: 'boolean',
        sortable: true,
        editable: true
    },
    {
        label: 'Email',
        fieldName: 'Email__c',
        type: 'email'
    },
    {
        label: 'Mobile',
        fieldName: 'Mobile__c',
        type: 'phone'
    },
    {
        type: 'action',
        typeAttributes: {
            rowActions: actions
        }
    }
];

export default class StudentManagement extends LightningElement {

    columns = COLUMNS;

    @track allStudents = [];
    @track students = [];
    @track displayRecords = [];

    draftValues = [];

    page = 1;
    pageSize = 5;
    totalPages = 0;

    sortedBy;
    sortedDirection = 'asc';

    wiredResult;

    @wire(getStudents)
    wiredStudents(result) {
        this.wiredResult = result;

        if (result.data) {
            this.allStudents = result.data;
            this.students = [...this.allStudents];
            this.updatePagination();
        } else if (result.error) {
            this.showToast('Error', 'Students load nahi hue', 'error');
        }
    }

    handleSearch(event) {
        const keyword = event.target.value.toLowerCase();

        this.students = this.allStudents.filter(student => {
            const name = student.Name ? student.Name.toLowerCase() : '';
            const course = student.Course__c ? student.Course__c.toLowerCase() : '';

            return name.includes(keyword) || course.includes(keyword);
        });

        this.page = 1;
        this.updatePagination();
    }

    handleSort(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;

        this.sortData(this.sortedBy, this.sortedDirection);
    }

    sortData(fieldName, direction) {
        let data = [...this.students];

        data.sort((a, b) => {
            let valueA = a[fieldName] ? a[fieldName] : '';
            let valueB = b[fieldName] ? b[fieldName] : '';

            if (valueA > valueB) {
                return direction === 'asc' ? 1 : -1;
            }

            if (valueA < valueB) {
                return direction === 'asc' ? -1 : 1;
            }

            return 0;
        });

        this.students = data;
        this.updatePagination();
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.students.length / this.pageSize);

        if (this.totalPages === 0) {
            this.totalPages = 1;
        }

        const start = (this.page - 1) * this.pageSize;
        const end = start + this.pageSize;

        this.displayRecords = this.students.slice(start, end);
    }

    handlePrevious() {
        if (this.page > 1) {
            this.page--;
            this.updatePagination();
        }
    }

    handleNext() {
        if (this.page < this.totalPages) {
            this.page++;
            this.updatePagination();
        }
    }

    get isPreviousDisabled() {
        return this.page === 1;
    }

    get isNextDisabled() {
        return this.page === this.totalPages;
    }

    handleSave(event) {
        const updatedFields = event.detail.draftValues;

        updateStudents({ students: updatedFields })
            .then(() => {
                this.showToast('Success', 'Student updated successfully', 'success');
                this.draftValues = [];
                return refreshApex(this.wiredResult);
            })
            .catch(error => {
                this.showToast('Error', 'Update failed', 'error');
            });
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'delete') {
            this.deleteStudentRecord(row.Id);
        }
    }

    deleteStudentRecord(studentId) {
        deleteStudent({ studentId: studentId })
            .then(() => {
                this.showToast('Success', 'Student deleted successfully', 'success');
                return refreshApex(this.wiredResult);
            })
            .catch(error => {
                this.showToast('Error', 'Delete failed', 'error');
            });
    }

    handleCreateSuccess() {
        this.showToast('Success', 'Student created successfully', 'success');
        return refreshApex(this.wiredResult);
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });

        this.dispatchEvent(event);
    }
}