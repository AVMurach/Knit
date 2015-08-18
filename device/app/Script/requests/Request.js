//perem control

var cpReq
var objectOfModified

// ------------------------ requests screen module ------------------------

function OnLoading(){
	SetListType();
}

//Счетчик заявок на сегодня
function GetTodaysActiveTask(){
	var q = new Query("SELECT Id FROM Document_Requests WHERE DateBeginPlan >= @DateStart AND DateBeginPlan < @DateEnd ");
	q.AddParameter("DateStart", DateTime.Now.Date);
	q.AddParameter("DateEnd", DateTime.Now.Date.AddDays(1));
	return q.ExecuteCount(); 
}

//Счетчик всех заявок
function GetAllActiveTask(){
	var q = new Query("SELECT Id FROM Document_Requests ");//
	return q.ExecuteCount(); 
}

//Получение заявок на сегодня
function GetToDayDoneRequestsWithSearch(searchText, getCount){//(searchText - строка поиска, getCount - получать ли количество[1-ДА,0-НЕТ])
	var q = new Query();
	var qtext = "SELECT REQ.Id AS Ind, REQ.ShortDescription, REQ.Status, REQ.DateBeginPlan, REQ.DateEndPlan, CLNT.Description AS Descr " +
			"FROM Document_Requests REQ " +
			"LEFT JOIN Enum_StatusTask ST ON ST.Id = REQ.Status " +
			"LEFT JOIN Catalog_Clients CLNT ON CLNT.Id = REQ.Partner " +
			"WHERE (REQ.DateBeginPlan >= @DateStart AND REQ.DateBeginPlan < @DateEnd)";
	if (searchText != null && searchText != ""){
		searchtail = "AND  Contains(CLNT.Description, @SearchText)";
		
		q.AddParameter("SearchText", searchText);
		qtext = qtext + searchtail;
	}
	q.Text = qtext + "  ORDER BY REQ.DateBeginPlan";
	
	q.AddParameter("DateStart", DateTime.Now.Date);
	q.AddParameter("DateEnd", DateTime.Now.Date.AddDays(1));
	
	if (getCount == 0) {
		var c = q.Execute();
		return c; 
	} else {
		return q.ExecuteCount();
	}
}

//Получение всех заявок
function GetAllActiveTaskDetails(searchtext){
	var q = new Query();
	var qtext = "SELECT REQ.Id AS Ind, REQ.ShortDescription, REQ.Status, REQ.DateBeginPlan, REQ.DateEndPlan, CLNT.Description  AS Descr " +
			"FROM Document_Requests REQ " +
			"LEFT JOIN Enum_StatusTask ST ON ST.Id = REQ.Status " +
			"LEFT JOIN Catalog_Clients CLNT ON CLNT.Id = REQ.Partner ";
	
	if (searchtext != null && searchtext != ""){
		var searchtail = " AND  Contains(CLNT.Description, @SearchText)";
		q.AddParameter("SearchText", searchtext);
		qtext = qtext + searchtail;
	}
	
	/*if (recvStartPeriod != undefined){
		var starttail = " AND REQ.PlanStartDataTime >= @DateStart";//AND REQ.PlanStartDataTime < @DateEnd
		q.AddParameter("DateStart", recvStartPeriod);
		qtext = qtext + starttail;
		
	}
	
	if (recvStopPeriod != undefined){
		var stoptail = " AND REQ.PlanStartDataTime < @DateEnd";//AND REQ.PlanStartDataTime < @DateEnd
		q.AddParameter("DateEnd", recvStopPeriod);
		qtext = qtext + stoptail;
	}*/
	
	q.Text = qtext + "  ORDER BY REQ.DateBeginPlan";
	var c = q.Execute();
	//Dialog.Debug(c);
	return c; 
}





//------------------------ request screen module ------------------------ 


//получение заявки
function GetCurrentRequest(){
	//Dialog.Debug(requestGlob);
		
	var q = new Query("SELECT REQ.Id AS Ind, REQ.ShortDescription, REQ.Status, REQ.DateBeginPlan, REQ.DateEndPlan, CLNT.Description  AS Descr, " +
			"REQ.ContactType, U1C.Description AS Responsible, U1C2.Description AS Author, REQ.DateDonePlan, REQ.DateDone, REQ.DateAcceptance, " +
			"TRGT.Description AS Target, REQ.DetailDescription, RSLT.Description AS ResultInter, CONT.Description AS ContactFace, " +
			"STAT.Name AS StatName, STAT.Description AS StatDesc " +
			"FROM Document_Requests REQ " +
			"LEFT JOIN Enum_StatusTask ST ON ST.Id = REQ.Status " +
			"LEFT JOIN Catalog_Clients CLNT ON CLNT.Id = REQ.Partner " +
			"LEFT JOIN Catalog_Users1C U1C ON U1C.Id = REQ.Responsible " +
			"LEFT JOIN Catalog_Users1C U1C2 ON U1C2.Id = REQ.Author " +
			"LEFT JOIN Catalog_Target TRGT ON TRGT.Id = REQ.Target " +
			"LEFT JOIN Catalog_ResultInter RSLT ON RSLT.ID = REQ.ResultInter " +
			"LEFT JOIN Catalog_Contacts CONT ON CONT.ID = REQ.ContactFace " +
			"LEFT JOIN Enum_StatusTask STAT ON STAT.Id = REQ.Status " +
			"WHERE REQ.Id == @cst ");
	q.AddParameter("cst", cpReq);
	return q.Execute();
}

//Принятие к исполнению задачи
function TakeExecution(curreqInd){
	Dialog.Question(Translate["Принять к исполнению?"], DialogTakeExecution, curreqInd);		
}

function DialogTakeExecution(answ, state){
	if (answ == DialogResult.Yes) {
		obj = state.GetObject();
		obj.DateAcceptance = DateTime.Now;
		obj.Status = "@ref[Enum_StatusTask]:A0EEE1AD-871A-17A4-447A-03299F0F3898" //Статус в работе 
		obj.Save();
		
		objectOfModified = true;
		Workflow.Refresh([state]);
	}
}

//Выполнение задачи
function RunTask(curreqInd){
	Dialog.Question(Translate["Выполнить?"], DialogRunTask, curreqInd);
}

function DialogRunTask(answ, state){
	if (answ == DialogResult.Yes) {
		obj = state.GetObject();
		obj.DateDone = DateTime.Now;
		obj.Status = "@ref[Enum_StatusTask]:96257DF6-7614-782E-4F48-76D908A8C9B3" //Статус Завершено 
		obj.Save();
		
		objectOfModified = true;
		Workflow.Refresh([state]);
	}
}


function QuestAndDoRollback(){
	if(objectOfModified == true){
		var curTask;
		Dialog.Question(Translate["Сохранить задачу?"], DialogQuestAndDoRollback, curTask);
	}else{
		objectOfModified = false;
		Workflow.Rollback();
	}	
}

function DialogQuestAndDoRollback(answ, state){
	if (answ == DialogResult.Yes) {
		Workflow.Commit();        
    }else{
    	objectOfModified = false;
    	Workflow.Rollback();
    }
}



////////////////////////////////////////////////ОБЩИЕ ФУНКЦИИ

function GetDate_ddMMyy(Period)
{
	var s = String.Format("{0:dd/MM/yyyy}", DateTime.Parse(Period));
	if(s == "01.01.0001"){
		s = 0;
	}
	return s;
}

function СheckDateNull(СheckDate){
	
	if(СheckDate == '0001-01-01 00:00:00' || СheckDate == '00:00'){
		return true;
	}else{
		return false;
	}
		
}



function PeriodTime(dateStart, dateStop){

	if (dateStop != NULL){
		var p = String.Format("{0:dd.MM.} {0:HH:mm} - {1:HH:mm}", DateTime.Parse(dateStart), DateTime.Parse(dateStop));
		//String.Format("{0:dd.MM. 0:hh:mm - 1:hh:mm}", DateTime.Parse(dateStart), DateTime.Parse(dateStop));
	} else {
		var p = String.Format("{0:dd.MM.} {0:HH:mm}", DateTime.Parse(dateStart));
	}	
	return p;
}

function Test(testValue){
	Dialod.Debug(testValue);
	return;
}

function AddPeremAndAction(name, value, actionName) {
	if (name == "cpReq")
		cpReq = value;		
	
	Workflow.Action(actionName, []);
}

//-----------------------------code from Masha----------------------------


function SetListType() {
    if ($.Exists("visitsType") == false)
        $.AddGlobal("visitsType", "planned");
    else
        return $.visitsType;
}

function ChangeListAndRefresh(control) {
    $.Remove("visitsType");
    $.AddGlobal("visitsType", control);
    Workflow.Refresh([]);
}





