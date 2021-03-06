﻿// ------------------------ requests screen module ------------------------

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





//////////////////////////////////////////////// ОБЩИЕ ФУНКЦИИ
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

function AddGlobalAndAction(name, value, actionName) {
	if (Variables.Exists(name))
		$.Remove(name);
	$.AddGlobal(name, value);
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








//////////////////////////////////////////////////////////  СТАРОЕ



function MakeFilterSettingsBackUp(){
	
	if ($.Exists("BUFilterCopy") == true){
		$.Remove("BUFilterCopy");
		$.Add("BUFilterCopy", new Dictionary());
		$.BUFilterCopy.Add("Start", recvStartPeriod);
		$.BUFilterCopy.Add("Stop", recvStopPeriod);
	} else {
		$.Add("BUFilterCopy", new Dictionary());
		$.BUFilterCopy.Add("Start", recvStartPeriod);
		$.BUFilterCopy.Add("Stop", recvStopPeriod);
	}
	
}

function RollBackAndBack(){
	recvStartPeriod = $.BUFilterCopy.Start;
	recvStopPeriod = $.BUFilterCopy.Stop;
	Workflow.Back();
	
}

function clearmyfilter(){
	$.beginDate.Text = "";
	recvStartPeriod = undefined;
	$.endDate.Text = "";
	recvStopPeriod = undefined;
}





function GetToDayUnDoneRequestsWithSearch(searchText, getCount){//(searchText - строка поиска, getCount - получать ли количество[1-ДА,0-НЕТ])
	var q = new Query();
	var qtext = "SELECT CUST.Description AS CustName,  ADDRS.Address AS Addr, REQ.PlanStartDataTime AS Start, REQ.PlanEndDataTime AS Stop, REQ.Id AS Ind FROM Document_Visit REQ LEFT JOIN Catalog_Customer CUST ON REQ.Customer = CUST.Id LEFT JOIN Catalog_Outlet ADDRS ON REQ.Outlet = ADDRS.Id WHERE (REQ.PlanStartDataTime >= @DateStart AND REQ.PlanStartDataTime < @DateEnd AND REQ.Status != @StatusComp AND REQ.Status != @StatusEx)";
	if (searchText != null && searchText != ""){
		searchtail = " AND  Contains(CUST.Description, @SearchText)";
		q.AddParameter("SearchText", searchText);
		qtext = qtext + searchtail;
	}
	q.Text = qtext + " ORDER BY REQ.PlanStartDataTime"; 
	q.AddParameter("StatusComp", DB.Current.Constant.VisitStatus.Completed);
	q.AddParameter("StatusEx", DB.Current.Constant.VisitStatus.Expired);
	q.AddParameter("DateStart", DateTime.Now.Date);
	q.AddParameter("DateEnd", DateTime.Now.Date.AddDays(1));
	
	if (getCount == 0) {
		var c = q.Execute();
		return c; 
	} else {
		return q.ExecuteCount();
	}
}


	
function SetBeginDate() {
	var header = Translate["#enterDateTime#"];
	if(recvStartPeriod != undefined){
		Dialog.ShowDateTime(header, recvStartPeriod, SetBeginDateNow);
	} else {
		Dialog.ShowDateTime(header, SetBeginDateNow);
	}
}

function SetBeginDateNow(key) {
	$.beginDate.Text = filterDate(key);
	recvStartPeriod = BegOfDay(key);
	//Workflow.Refresh([]);
}

function SetEndDate() {
	var header = Translate["#enterDateTime#"];
	if(recvStopPeriod != undefined){
		Dialog.ShowDateTime(header, recvStopPeriod, SetEndDateNow);
	} else {
		Dialog.ShowDateTime(header, SetEndDateNow);
	}
}

function SetEndDateNow(key) {
	$.endDate.Text = filterDate(key);
	recvStopPeriod = EndOfDay(key);
	//Dialog.Debug(BegOfDay(key));
	//Workflow.Refresh([]);
}



function ClearFilter(){
	recvStartPeriod = undefined;
	recvStopPeriod = undefined;
	Workflow.Refresh([]);
}



function filterDate(dt){
	if (dt != null){
		return String.Format("{0:dd MMMM yyyy}", DateTime.Parse(dt));
	} else {
		return "";
	}
}

function filterDateCaption(dt){
	if (dt != null){
		return String.Format("{0:dd.MM.yyyy}", DateTime.Parse(dt));
	} else {
		return "";
	}
}

function initvalues(){ // Инициализация переменных фильтра
	if ($.Exists("searchToDay") == false){
		$.AddGlobal("searchToDay", null);
	} 
	
	if ($.Exists("searchAll") == false){
		$.AddGlobal("searchAll", null);
	} 
	
	if ($.Exists("filterStart") == false){
		$.AddGlobal("filterStart", null);
	} 
	
	if ($.Exists("filterStop") == false){
		$.AddGlobal("filterStop", null);
	}
	
//	Dialog.Debug("SaerchAll" + $.searchAll);
//	Dialog.Debug("search to day" + $.searchToDay);
//	Dialog.Debug("Start" + $.filterStart);
//	Dialog.Debug("Stop" + $.filterStop);
}

function findtodaytext(key){
	$.Remove("searchToDay");
	$.AddGlobal("searchToDay", key);
	Workflow.Refresh([]);
}

function findinalltext(key){
	$.Remove("searchAll");
	$.AddGlobal("searchAll", key);
	Workflow.Refresh([]);
}



