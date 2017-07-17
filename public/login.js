(function($){
	"use strict";
	
	var cnt=3;
	var cntDownInit=30;
	var cntDown=cntDownInit;
	var ele="<h4><strong>警告!  </strong>用户名或密码错误。您还有#n次机会。</h4>";
	var spele="<h4><strong>警告!  </strong>连续三次错误，请##ns后再试。</h4>";
	$('#myAlert').hide();

	$('.close').click(function(){
		$('#myAlert').alert();
	});

	$('#loginForm').on('submit',function(ev){
		var formdata = new FormData();
		formdata.append('username',$('#username').val());
		formdata.append('password',$('#password').val());
		//console.log(formdata);
		$.ajax({
			url:"http://"+window.location.host.split(":")[0]+":8080/login",
			type:"POST",
			data:formdata,
			processData:false,
			contentType:false,
			cache:false,
			crossDomain:true,
			success:function(result){
				//console.log(result);
				if (result=='error'){
					cnt=cnt-1;
					if(cnt==0){
						cnt=3;
						$('#loginBtn').attr('disabled','true');
						var inter=setInterval(function(){
							cntDown=cntDown-1;
							var newWarning=spele.replace('##n',cntDown);
							$('#warningMsg').empty();
							$('#warningMsg').append(newWarning);
							$('#myAlert').show();
							if(cntDown==0){
								window.clearInterval(inter);
								cntDown=cntDownInit;
								$('#myAlert').hide();
								$('#loginBtn').removeAttr('disabled');
							}
						},1000);
						
					}
					else{
						var newWarning=ele.replace('#n',cnt);
						$('#warningMsg').empty();
						$('#warningMsg').append(newWarning);
						$('#myAlert').show();
					}
				}
				else{
					document.open();
					document.write(result);
					document.close();
				}
			},
			error:function(error){
				console.log(error);
			}
		})
		ev.preventDefault();
	})
})(jQuery);