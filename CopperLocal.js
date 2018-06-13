//***************普通的对象****************//
//**********************ud copper image***********************//
/**
 * 适用页面中上传图片，单选单存在情况
 * 1.最多设置3个预览块
 */
var CopperLocal = (function(copperLocal){
	
	var config = {
		maxSize: 2*1024*1024, //默认限制2M
		defaultPreview: 100,
		id: "", 
		previewId: "", 
		chooseId: "",
		uploadUrl: "",
		beforeUpload: null, //function
		uploadCallback: null, //function
		aspectRatio: 0 //长宽比，默认不限制
	};
	
	/* 基础HTML
	 * ._CopperLocal_btn 按钮样式
	 * #CopperLocal_upload 上传按钮ID
	 * #CopperLocal_reset 重置按钮ID
	 * #CopperLocal_show 显示选中的图片
	 */
	function mainHtml(){
		var btns = '<div><label class="_CopperLocal_btn" for="CopperLocal_upload">选择图片</label>'
			  +'<input id="CopperLocal_upload" type="file" accept="image/jpeg,image/png" style="position:absolute; clip:rect(0 0 0 0);">'
			  +'<label id="CopperLocal_reset" class="_CopperLocal_btn">重置</label></div>',
			shows = '<div id="CopperLocal_show"></div>';
		return btns + shows;
	}
	
	/* 预览HTML
	 * ._CopperLocal_preview 裁减的预览图
	 */
	function previewHtml(){
		var previews = '<div class="_CopperLocal_preview"></div>';
		return previews;
	}
	
	//大小限制
	function getFileMaxSizeError(){
		if(Math.floor(config.maxSize/1024/1024) == 0){
			return "图片大小不能超过"+ (config.maxSize) +"KB,请重新上传！";
		}else if(Math.floor(config.maxSize/1024/1024) > 0){
			return "图片大小不能超过"+ (config.maxSize/1024/1024) +"M,请重新上传！";
		}else{
			return "图片大小限制不能为负";
		}
	}
	
	//将以base64数据转换为Blob  
    function convertBase64UrlToBlob(b64Data){  
        var bytes = window.atob(b64Data.split(',')[1]); //去掉url的头，并转换为byte  
        var ab = new ArrayBuffer(bytes.length);  
        
        var ia = new Uint8Array(ab);  
        for (var i = 0; i < bytes.length; i++) {  
            ia[i] = bytes.charCodeAt(i); //处理异常,将ascii码小于0的转换为大于0
        }  
        return new Blob([ia], {type : $('#mineImg').data('type')});  
    }
	
	//读取选中图片
	function reads(imgFile){
	    var reader = new FileReader();
	    reader.readAsDataURL(imgFile);
	    reader.onload = function(){
	        document.getElementById("CopperLocal_show").innerHTML = "<img id='mineImg' src='" 
	        	+ reader.result + "' data-type='"+imgFile.type+"'>";
	        
	        var $previews = $('._CopperLocal_preview');
	        $('#mineImg').cropper({
	        	viewMode: 1,
	        	aspectRatio: config.aspectRatio,
	            dragMode: 'move',
	            restore: false,
	            guides: false,
	            cropBoxMovable: false,
	            cropBoxResizable: false,
	        	ready: function (e) {
	                var $clone = $(this).clone().removeClass('cropper-hidden');
	                $clone.css({
	                  display: 'block',
	                  width: '100%',
	                  minWidth: 0,
	                  minHeight: 0,
	                  maxWidth: 'none',
	                  maxHeight: 'none'
	                });
	                $previews.css({
	                  overflow: 'hidden'
	                }).html($clone);
	                
	                $('#' + config.chooseId).removeAttr('disabled');
	            },
	            crop: function (e) {
	                var imageData = $(this).cropper('getImageData');
	                var previewAspectRatio = e.width / e.height;

	                $previews.each(function () {
	                  var $preview = $(this);
	                  var previewWidth = $preview.width();
	                  var previewHeight = previewWidth / previewAspectRatio;
	                  var imageScaledRatio = e.width / previewWidth;

	                  $preview.height(previewHeight).find('img').css({
	                    width: imageData.naturalWidth / imageScaledRatio,
	                    height: imageData.naturalHeight / imageScaledRatio,
	                    marginLeft: -e.x / imageScaledRatio,
	                    marginTop: -e.y / imageScaledRatio
	                  });
	                });
	            }
	        });
	    };
	}
	
	//入口：初始化
	var init = function(){
		//选择区
		$('#' + config.id).append(mainHtml());
		$('#CopperLocal_show').attr('style', 'width:300px; height:300px; border:1px solid #e2e2e2; margin-top:10px'); 
		$('._CopperLocal_btn').attr('style', 'display:inline-block; background-color:#444444;'
				+ 'color: white; padding: 5px 15px; margin-right: 10px; cursor:pointer; font-size: 14px')
			.mouseover(function(){this.style.backgroundColor = '#555555';})
			.mouseout(function(){this.style.backgroundColor = '#444444';});

		//预览区
		if(!!config.previewId){
			$('#' + config.previewId).append(previewHtml());
			$($('._CopperLocal_preview')[0]).css('width', config.defaultPreview  + 'px')
								      .css('height', config.defaultPreview + 'px')
								      .css('border', '1px solid #e2e2e2');
		}
		
		//上传按钮
		$("#CopperLocal_upload").on("change", function () {
	        var imgFile = this.files;
	        
	        //验证大小
        	if(imgFile[0].size > config.maxSize){
        		alertify.error(getFileMaxSizeError());
        		$("#CopperLocal_upload").val('');
        		return;
        	}
	        
	        reads(imgFile[0]);
	    });
		
		//重置按钮
		$('#CopperLocal_reset').on("click", function(){
	    	$('#mineImg').cropper('reset');
	    });
		
		//确认点击
	    //1. ajax上传file,模拟file表单提交
	    //2. 将裁减图片添加到主页面
		if($('#' + config.chooseId).length != 0){
			$('#' + config.chooseId).click(function(){
		    	var copperImg = $('#mineImg').cropper('getCroppedCanvas').toDataURL($('#mineImg').data('type'));
		    	var formTmp = new FormData();
		    	formTmp.append("copperImage", convertBase64UrlToBlob(copperImg));
		    	if(!!config.uploadUrl){
		    		if(typeof config.beforeUpload == 'function'){
	    				config.beforeUpload();
	    			}
		    		$.ajax({
			    		type: 'post',
			    		url: config.uploadUrl,
			    		data: formTmp,
			    		cache: false,
			    		processData: false, //必须
			    		contentType : false, //必须
			    		success: function(data){
			    			if(typeof config.uploadCallback == 'function'){
			    				config.uploadCallback(data);
			    			}
			    		}
			    	});
		    	}else{
		    		alertify.error("需配置服务器上传地址: uploadUrl");
		    	}
		    });
		}
	};
	
	//config
	copperLocal.config = function(cfg){
		for(var k in cfg){
			if(config.hasOwnProperty(k)){
				config[k] = cfg[k];
			}
		}
		
		init();
	};
	
	//清空选择
	copperLocal.clear = function(){
		$('#mineImg').cropper('destroy');
		$('#mineImg').remove();
		$('#' + config.id).html('');
		$('#' + config.previewId).html('');
    	
		//重新置灰，选择按钮
		$('#' + config.chooseId).attr('disabled', 'disabled');
		
    	//清空file value
    	$("#CopperLocal_upload").val('');
	};
	
	return copperLocal;
	
})(CopperLocal || {});
//**********************ud copper image***********************//