public with sharing class StudentController {

    @AuraEnabled(cacheable=true)
    public static List<Student__c> getStudents() {
        return [
            SELECT Id, Name, Course__c, Email__c, Mobile__c,Fees_paid__c
            FROM Student__c
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
    public static void updateStudents(List<Student__c> students) {
        update students;
    }

    @AuraEnabled
    public static void deleteStudent(Id studentId) {
        delete [
            SELECT Id
            FROM Student__c
            WHERE Id = :studentId
            LIMIT 1
        ];
    }
}