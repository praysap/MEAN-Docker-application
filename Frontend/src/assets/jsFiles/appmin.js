/*
Stix2viz and d3 are packaged in a way that makes them work as Jupyter
notebook extensions.  Part of the extension installation process involves
copying them to a different location, where they're available via a special
"nbextensions" path.  This path is hard-coded into their "require" module
IDs.  Perhaps it's better to use abstract names, and add special config
in all cases to map the IDs to real paths, thus keeping the modules free
of usage-specific hard-codings.  But packaging in a way I know works in
Jupyter (an already complicated environment), and having only this config
here, seemed simpler.  At least, for now.  Maybe later someone can structure
these modules and apps in a better way.
 */

require.config({
	paths : {
		"nbextensions/stix2viz/d3" : "stix2viz/d3/d3"
	}
});

require(
		[ "domReady!", "stix2viz/stix2viz/stix2viz" ],
		function(document, stix2viz) {

			/*
			 * var dataX = { "type": "bundle", "id":
			 * "bundle--44af6c39-c09b-49c5-9de2-394224b04982", "spec_version":
			 * "2.0", "objects": [ { "type": "indicator", "id":
			 * "indicator--d81f86b9-975b-4c0b-875e-810c5ad45a4f", "created":
			 * "2014-06-29T13:49:37.079Z", "modified":
			 * "2014-06-29T13:49:37.079Z", "labels": [ "malicious-activity" ],
			 * "name": "Malicious site hosting downloader", "pattern":
			 * "[url:value = 'http://x4z9arb.cn/4712/']", "valid_from":
			 * "2014-06-29T13:49:37.079000Z" }, { "type": "malware", "id":
			 * "malware--efd5ac80-79ba-45cc-9293-01460ad85303", "created":
			 * "2014-06-30T09:15:17.182Z", "modified":
			 * "2014-06-30T09:15:17.182Z", "name": "x4z9arb backdoor", "labels": [
			 * "backdoor", "remote-access-trojan" ], "description": "This
			 * malware attempts to download remote files after establishing a
			 * foothold as a backdoor.", "kill_chain_phases": [ {
			 * "kill_chain_name": "mandiant-attack-lifecycle-model",
			 * "phase_name": "establish-foothold" } ] }, { "type":
			 * "threat-actor", "id":
			 * "threat-actor--e234c322-0981-4aa4-ae03-f4037e6be83f", "created":
			 * "2017-07-18T22:00:30.405Z", "modified":
			 * "2017-07-18T22:00:30.405Z", "name": "(Unnamed) IMDDOS Threat
			 * Actor", "labels": [ "criminal" ] }, { "type": "relationship",
			 * "id": "relationship--6ce78886-1027-4800-9301-40c274fd472f",
			 * "created": "2014-06-30T09:15:17.182Z", "modified":
			 * "2014-06-30T09:15:17.182Z", "relationship_type": "indicates",
			 * "source_ref": "indicator--d81f86b9-975b-4c0b-875e-810c5ad45a4f",
			 * "target_ref": "malware--efd5ac80-79ba-45cc-9293-01460ad85303" }, {
			 * "type": "relationship", "id":
			 * "relationship--80f31be7-1377-4143-86e9-3f9037d072ad", "created":
			 * "2017-07-18T22:00:30.408Z", "modified":
			 * "2017-07-18T22:00:30.408Z", "relationship_type": "uses",
			 * "source_ref":
			 * "threat-actor--e234c322-0981-4aa4-ae03-f4037e6be83f",
			 * "target_ref": "indicator--d81f86b9-975b-4c0b-875e-810c5ad45a4f" } ] }
			 */

			// Init some stuff
			// MATT: For optimization purposes, look into moving these to local
			// variables
			selectedContainer = document.getElementById('selection');
			uploader = document.getElementById('uploader');
			canvasContainer = document.getElementById('canvas-container');
			canvas = document.getElementById('canvas');
			// canvas.setTransform(1, 0, 0, 1, 0, 0);
			// canvas.clearRect(0, 0, canvas.width, canvas.height);
			
			// Restore the transform
			// canvas.restore();
			if(uploader != null){
			styles = window.getComputedStyle(uploader,null);
			}

			/*******************************************************************
			 * Resizes the canvas based on the size of the window
			 ******************************************************************/
			function resizeCanvas() {
				var cWidth = 0;
				if(document.getElementById('legend1') != null){
					var cWidth = document.getElementById('legend1').offsetLeft - 52;
				}
				
				/*
				 * var cHeight = window.innerHeight -
				 * document.getElementsByTagName('h1')[0].offsetHeight - 27;
				 */
				var cHeight = 500;
				// alert("width "+cWidth+" Height"+cHeight);
				// alert("canvas size "+cWidth+" "+cHeight);
				if(document.getElementById('canvas-wrapper') != null){
					document.getElementById('canvas-wrapper').style.width = cWidth;
				}
				if(canvas && canvas.style){
					canvas.style.width = (screen.width * 93) / 100;
					canvas.style.height = (screen.height * 80) / 100;
				}
			
			}

			/*******************************************************************
			 * Will be called right before the graph is built.
			 ******************************************************************/
			function vizCallback() {
				hideMessages();
				resizeCanvas();
			}

			/*******************************************************************
			 * Will be called if there's a problem parsing input.
			 ******************************************************************/
			function errorCallback() {
				document.getElementById('chosen-files').innerText = "";
				document.getElementById("files").value = "";
			}

			/*******************************************************************
			 * Initializes the graph, then renders it.
			 ******************************************************************/
			function vizStixWrapper(content, customConfig) {
				// alert("vizstixwrapper");
				cfg = {
					iconDir : "stix2viz/stix2viz/icons"
				}

				stix2viz.vizInit(canvas, cfg, populateLegend, populateSelected,
						contextMenu);
				stix2viz.vizStix(content, customConfig, vizCallback,
						errorCallback);
			}

			/*******************************************************************
			 * -----------------------------------------------------
			 * ****************************************************** This group
			 * of functions is for handling file "upload." They take an event as
			 * input and parse the file on the front end.
			 ******************************************************************/
			function handleFileSelect(evt) {
				handleFiles(evt.target.files);
			}
			function handleFileDrop(evt) {
				evt.stopPropagation();
				evt.preventDefault();

				handleFiles(evt.dataTransfer.files);
			}
			function handleDragOver(evt) {
				evt.stopPropagation();
				evt.preventDefault();
				evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this
														// is a copy.
			}
			function handleFiles(files) {
				// files is a FileList of File objects (in our case, just one)

				for (var i = 0, f; f = files[i]; i++) {
					document.getElementById('chosen-files').innerText += f.name
							+ " ";
					customConfig = document
							.getElementById('paste-area-custom-config').value;

					var r = new FileReader();
					r.onload = function(e) {
						vizStixWrapper(e.target.result, customConfig);
					};
					r.readAsText(f);
				}
				// linkifyHeader();
			}
			/* ---------------------------------------------------- */

			/*******************************************************************
			 * Handles content pasted to the text area.
			 ******************************************************************/
			function handleTextarea() {
				// alert("handletext");
				customConfig = document
						.getElementById('paste-area-custom-config').value;

				content = document.getElementById('paste-area-stix-json').value;
				vizStixWrapper(content, customConfig);
				// linkifyHeader();
			}

			function handleTextarea1() {
				// alert("handletext area1")
				customConfig = document
						.getElementById('paste-area-custom-config').value;

				// content =
				// document.getElementById('paste-area-stix-json').value;

				content = document.getElementById('paste-external-data').value;
				// alert("content " + content);
				vizStixWrapper(content, customConfig);
				// linkifyHeader();
			}
			/*******************************************************************
			 * Fetches STIX 2.0 data from an external URL (supplied user) via
			 * AJAX. Server-side Access-Control-Allow-Origin must allow
			 * cross-domain requests for this to work.
			 ******************************************************************/
			function handleFetchJson() {
				var url = document.getElementById("url").value;
				customConfig = document
						.getElementById('paste-area-custom-config').value;
				fetchJsonAjax(url, function(content) {
					vizStixWrapper(content, customConfig);
				});
				// linkifyHeader();
			}

			/*******************************************************************
			 * Adds icons and information to the legend.
			 * 
			 * Takes an array of type names as input
			 ******************************************************************/
			function populateLegend(typeGroups) {
				var ul = document.getElementById('legend-content');
				var color = d3.scale.category20();
				typeGroups.forEach(function(typeName, index) {
					var li = document.createElement('li');
					var val = document.createElement('p');
					var key = document.createElement('div');
					var keyImg = document.createElement('img');
					keyImg.src = stix2viz.iconFor(typeName);
					keyImg.width = "37";
					keyImg.height = "37";
					keyImg.style.background = "radial-gradient(" + color(index)
							+ " 16px,transparent 16px)";
					key.appendChild(keyImg);
					val.innerText = typeName.charAt(0).toUpperCase()
							+ typeName.substr(1).toLowerCase(); // Capitalize it
					li.appendChild(key);
					li.appendChild(val);
					ul.appendChild(li);
				});
			}

			/*******************************************************************
			 * Adds information to the selected node table.
			 * 
			 * Takes datum as input
			 ******************************************************************/
			function populateSelected(d) {
				// Remove old values from HTML
				selectedContainer.innerHTML = "";

				$('#stixinfomodal').modal('show');
				var counter = 0;

				Object.keys(d).forEach(function(key) { // Make new HTML
														// elements and display
														// them
					// Create new, empty HTML elements to be filled and injected
					var div = document.createElement('div');
					var type = document.createElement('div');
					var val = document.createElement('div');

					// Assign classes for proper styling
					if ((counter % 2) != 0) {
						div.classList.add("odd"); // every other row will have
													// a grey background
					}
					type.classList.add("type");
					val.classList.add("value");

					// Add the text to the new inner html elements
					var value = d[key];
					type.innerText = key;
					val.innerText = value;

					// Add new divs to "Selected Node"
					div.appendChild(type);
					div.appendChild(val);
					selectedContainer.appendChild(div);

					// increment the class counter
					counter += 1;
				});
			}

			/*******************************************************************
			 * Hides the data entry container and displays the graph container
			 ******************************************************************/
			function hideMessages() {
				// uploader.classList.toggle("hidden");
				canvasContainer.classList.toggle("hidden");

			}

			function resetPage() {
				hideMessages();
				stix2viz.vizReset();
			}

			/*******************************************************************
			 * Generic AJAX 'GET' request.
			 * 
			 * Takes a URL and a callback function as input.
			 ******************************************************************/
			function fetchJsonAjax(url, cfunc) {
				var regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
				if (!regex.test(url)) {
					alert("ERROR: Double check url provided");
				}

				var xhttp;
				if (window.XMLHttpRequest) {
					xhttp = new XMLHttpRequest();
				} else {
					xhttp = new ActiveXObject("Microsoft.XMLHTTP"); // For IE5
																	// and IE6
																	// luddites
				}
				xhttp.onreadystatechange = function() {
					if (xhttp.readyState == 4 && xhttp.status == 200) {
						cfunc(xhttp.responseText);
					} else if (xhttp.status != 200 && xhttp.status != 0) {
						alert("ERROR: " + xhttp.status + ": "
								+ xhttp.statusText
								+ " - Double check url provided");
						return;
					}

					xhttp.onerror = function() {
						alert("ERROR: Unable to fetch JSON. The domain entered has either rejected the request, \
is not serving JSON, or is not running a webserver.\n\nA GitHub Gist can be created to host RAW JSON data to prevent this.");
					};
				}
				xhttp.open("GET", url, true);
				xhttp.send();
			}

			// ***************************************************** */

			function handleFiles2() {
				// d3.json("stix2viz/stix2viz/Test_Data1.json", function(data){
				console.log(dataX)
				stix2viz.vizhandleFile(dataX);
				// });
			}

			/*******************************************************************
			 * AJAX 'GET' request from `?url=` parameter
			 * 
			 * Will check the URL during `window.onload` to determine if `?url=`
			 * parameter is provided
			 ******************************************************************/
			function fetchJsonFromUrl() {
				var url = window.location.href;

				// If `?` is not provided, load page normally
				if (/\?/.test(url)) {
					// Regex to see if `url` parameter has a valid url value
					var regex = /\?url=https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
					var res = regex.exec(url);
					if (res != null) {
						// Get the value from the `url` parameter
						req_url = res[0].substring(5);

						// Fetch JSON from the url
						fetchJsonAjax(req_url, function(content) {
							vizStixWrapper(content)
						});
						// linkifyHeader();

					} else {
						alert("ERROR: Invalid url - Request must start with '?url=http[s]://' and be a valid domain");
					}
				}
			}

			function selectedNodeClick() {

				selected = document.getElementById('selected');
				if (selected.className.indexOf('clicked') === -1) {
					selected.className += " clicked";
					selected.style.position = 'absolute';
					selected.style.left = '25px';
					selected.style.width = window.innerWidth - 110;
					selected.style.top = document.getElementById('legend1').offsetHeight + 25;
					selected.scrollIntoView(true);
				} else {
					selected.className = "sidebar1"
					selected.removeAttribute("style")
				}
			}

			// **********************************************************************************************************************

			/*
			 * function contextMenu(menu) { //alert("exploreclick"); // create
			 * the div element that will hold the context menu
			 * d3.selectAll('.d3-context-menu').data([1]) .enter()
			 * .append('div') .attr('class', 'd3-context-menu');
			 *  // close menu d3.select('div').on('click.d3-context-menu',
			 * function() { d3.select('.d3-context-menu').style('display',
			 * 'none'); }); // this gets executed when a contextmenu event
			 * occurs return function (data) {
			 * d3.selectAll('.d3-context-menu').html(''); var list =
			 * d3.selectAll('.d3-context-menu').append('ul');
			 * list.selectAll('li').data(menu).enter() .append('li')
			 * .html(function(d) { return (typeof d.title === 'string') ?
			 * d.title : d.title(data); }) .on('click', function(d) {
			 * d.action(data); d3.select('.d3-context-menu').style('display',
			 * 'none'); handleFiles2(); });
			 *  // display context menu d3.select('.d3-context-menu')
			 * .style('left', (d3.event.pageX - 2) + 'px') .style('top',
			 * (d3.event.pageY - 2) + 'px') .style('display', 'block');
			 * 
			 * d3.event.preventDefault(); d3.event.stopPropagation(); }; }
			 */

			function contextMenu(menu) {
				// create the div element that will hold the context menu
				d3.selectAll('.d3-context-menu').data([ 1 ]).enter().append(
						'div').attr('class', 'd3-context-menu');

				// close menu
				d3.select('div').on('click.d3-context-menu', function() {
					d3.select('.d3-context-menu').style('display', 'none');
				});
				// this gets executed when a contextmenu event occurs
				return function(data) {
					d3.selectAll('.d3-context-menu').html('');
					var list = d3.selectAll('.d3-context-menu').append('ul');
					list
							.selectAll('li')
							.data(menu)
							.enter()
							.append('li')
							.html(
									function(d) {
										return (typeof d.title === 'string') ? d.title
												: d.title(data);
									})
							.on(
									'click',
									function(d) {
										d.action(data);

										var test = {
											"search_value" : data.id
										};

										console.log(data.id);
										if (data.id.search("identity") == 0) {
											alert("This Object is not explorable.");

										} else {

											var resultvalue;

											var stix1 = JSON
													.parse(document
															.getElementById("paste-area-stix-json").value);
											// $("#modal-4").modal("show");
											var stix1size = stix1.objects.length;

											var stixdata = JSON
													.stringify(stix1);
											var searchvalue = data.id;
											$
													.ajax({
														type : "POST",
														contentType : "application/json",
														url : "restapiexplore/"
																+ searchvalue,

														data : stixdata,

														timeout : 1000,
														success : function(
																response) {
															// alert(JSON.stringify(response));

															resultvalue = response;

															// var stix1size=;
															// alert("result
															// value
															// size"+response.objects.length);
															if (stix1size == response.objects.length)
																alert("No  New Relationship Found");
															else {

																document
																		.getElementById('paste-area-stix-json').value = JSON
																		.stringify(resultvalue);

																resetPage();

																vizStixWrapper(
																		resultvalue,
																		customConfig);

															}

														},
														error : function(e) {
															// $("#modal-4").modal("hide");
															console.log(
																	"ERROR: ",
																	e);
														},

													});
											// alert("hidden document" +
											// dataXp);
											d3.select('.d3-context-menu')
													.style('display', 'none');
											// handleFiles2();
										}
									});

					// display context menu
					d3.select('.d3-context-menu').style('left',
							(d3.event.pageX - 2) + 'px').style('top',
							(d3.event.pageY - 2) + 'px').style('display',
							'block');

					d3.event.preventDefault();
					d3.event.stopPropagation();
				};
			}

			// **********************************************************************************************************************

			/*******************************************************************
			 * When the page is ready, setup the visualization and bind events
			 ******************************************************************/
			// document.getElementById('files').addEventListener('change',
			// handleFileSelect, false);
			if(document.getElementById('closebutton') != null){
				document.getElementById('closebutton').addEventListener('click',
					resetPage, false);
			}
			if(document.getElementById('paste-parser') != null){
				document.getElementById('paste-parser').addEventListener('click',
					handleTextarea, false);
			}
			
			if(document.getElementById('paste-parser1') != null){
				document.getElementById('paste-parser1').addEventListener('click',
					handleTextarea, false);
			}
			// document.getElementById('fetch-url').addEventListener('click',
			// handleFetchJson, false);
			// document.getElementById('header').addEventListener('click',
			// resetPage, false);
			// uploader.addEventListener('dragover', handleDragOver, false);
			// uploader.addEventListener('drop', handleFileDrop, false);
			window.onresize = resizeCanvas;
			// document.getElementById('selected').addEventListener('click',
			// selectedNodeClick, false);
			fetchJsonFromUrl();
		});
