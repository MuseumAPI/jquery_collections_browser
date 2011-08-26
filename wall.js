/*!
 * Victoria and Albert Museum Collections Browser jQuery plugin
 * http://www.vam.ac.uk/
 *
 * Copyright 2011, Victoria and Albert Museum
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
 
(function ($) {
    
  $.fn.wall = function(options) { 
        
        var wall = this;
        
        var defaults = {
                
            // dimensions and styles
            'width': 1024, // width of the wall
            'height': 768, // height of the wall
            'sizes': [
                { 'dim': 130, 'suff': '_jpg_o', 'name': 'Small images' },
                { 'dim': 177, 'suff': '_jpg_ws', 'name': 'Medium images' },
                { 'dim': 265, 'suff': '_jpg_w', 'name': 'Large images' },
                { 'dim': 355, 'suff': '_jpg_ds', 'name': 'X-Large images' }
            ],
            'start_size': 2,
            'tile_margin': 8, // margin around each tile
            'sidebar_image_size': 265, // size of the image in the sidebar panel
            'background_color': '#ffffff', // background colour of the whole wall
            'tile_border_color': '#a1a1a1', // colour of tile borders
            'img_fadein': 500, // how long each image should take to fade in (ms)
            'fullscreen_speed': 250, // how long the wall should take to resize (ms)
            'min_category_count': 30, // minimum number of objects a category must have to be displayed in the sidebar panel (because, say 10 objects don't make a good wall)
            'padding': 8, // amount of padding to add to elements that require padding
            'wall_border': '1px solid #a1a1a1',
            'panel_width': 'auto',
            'hide_loader_time': 2000, // how long to display the loading dialog after the images are all loaded
            'fill_direction': 'random', // what order to fill blank tile - values are 'forwards', 'backwards' or 'random'
            'tag_style': 'list', // how to display the tags - values are 'tagcloud', or 'list'
            'show_loading': false, // whether to display the loading dialog
            'show_more_link': false, // whether to display the link to the item details page in the sidebar
            'enable_history': false, 
            'enable_clipboard': false,
            'max_history': 20, // maximum items in history
                            
            // messaging
            'search_box_default': 'New search', // initial text in the search box
            'alert_title': 'Oops',
            'alert_msg_no_images': 'Sorry, there are not enough images for that search to fill the screen.',
            'alert_msg_enter_search': 'Please enter a search term and try again.',
            'alert_msg_zoom_max': 'Sorry, cannot zoom in any further.',
            'alert_msg_zoom_min': 'Sorry, cannot zoom out any further.',
            'title_no_term': 'Showing 1000 selected images.', // what to display in the title bar if there is no search term
            'tips': [
                'Try dragging the image grid to reveal more images.',
                'You can change the size of the tiles using the zoom buttons in the panel below.',
                'You can shuffle the images using the button in the panel below.',
                'Try switching to full screen and back using the toggle fullscreen button.',
                'Click on an image to reveal the sidebar with more information about the object.',
                'You can load images from a category by clicking the category names in the sidebar.',
                'You can drag this window.',
                'You can search for similar objects by clicking the object name in the sidebar.',
                'The search returns a maximum of 1000 objects.',
                'You can see the list of searches you\'ve done by clicking the toggle history button in the panel.'
            ],
            
            // api stuff
            'api_stub': 'http://www.vam.ac.uk/api/json/museumobject/',
            'api_search_path': 'search',
            'images_url': 'http://media.vam.ac.uk/media/thira/collection_images/',
            'collections_record_url': 'http://collections.vam.ac.uk/item/',
            'search_term': '', // the search to display. 
            'category': { // the category to display
                'id': null,
                'name': '',
                'term': ''
            },
            'max_results': 1000, // the max results we can handle
            'limit': 41, // how many images to get per api request
            'search_term': '', // term to search the api for
            'category-stub': '', // category to retrieve images from 
            'sidebar_image_suffix': '_jpg_w',
            'large_image_suffix': '_jpg_l',
            
            // html fragments
            'blank_tile': '<li class="blank"></li>',
            
            // nuts and bolts
            'cache_interval': 50, // how often to cache some images (ms)
            'fill_interval': 5, // how often to fill tiles from cache (ms)
            
            // list of taxonomy terms to populate the sidebar
            'taxonomy': [
                'styles',
                'collections',
                'subjects',
                'names',
                'exhibitions',
                'galleries',
                'techniques',
                'materials',
                'categories',
                'places'
            ],
            
            // fields to display in sidebar
            'tombstone': [
                ['Artist', 'artist' ],
                ['Date', 'date_text' ],
                ['Museum no.', 'museum_number' ],
                ['Materials &amp; techniques', 'materials_techniques'],
                ['Location', 'location'],
                ['Place', 'place'],
                ['History note', 'history_note']
            ],
            
            'event_click_sidebar_img': function(event) { 
                
                event.preventDefault();
                    
                var fsdiag = $('#fullsize', wall);
                if(!fullsize_dragged) {
                    fsdiag.css({
                        'top': 0,
                        'left': 0 
                    })
                }
                fsdiag.show();
                
            }
            
        };
        
        var settings = $.extend({}, defaults, options); 

        var methods = {
                
            showLoading: function() {
                
                var l = $('#loading', wall);
                l.css({
                    'left': wall.width()/2 - l.width()/2,
                    'top': wall.height()/2 - l.height()/2
                });
                $("span.ui-dialog-title", l).html("Please wait...");
                l.show();
                
            },
                    
            showDialog: function(wall, msg) {
                dia = $('#dialog', wall);
                $('#dialog_text', dia).html(msg);
                dia.css({
                    'left': wall.width()/2 - dia.width()/2,
                    'top': wall.height()/2 - dia.height()/2
                });
                dia.show();
            },
            
            populateSidebar: function(wall, objnum) {
                
                url = settings.api_stub + objnum;
                        
                $('#fullsize').hide();
                var sidebar = $("#sidebar", wall);
                
                sidebar.css({
                    'width': settings.sidebar_width,
                    'height': wall.height() - 2*settings.padding,
                    'top': 0,
                    'left': wall.width() - (settings.sidebar_width + 2*settings.padding),
                    'padding': settings.padding
                });
                
                var disabled = $("#disabled", wall);
                disabled.css({
                    'width': settings.sidebar_width,
                    'height': wall.height() - 2*settings.padding,
                    'top': 0,
                    'left': wall.width() - (settings.sidebar_width + 2*settings.padding),
                    'padding': settings.padding,
                    'z-index': 50
                }).show();
                
                if(!sidebar.is(':visible')) {
                    sidebar.show();
                }
                
                $.ajax({
                    dataType: 'jsonp',
                    url: url,
                    success: function (json) {
                        
                        musobj = json[0].fields;
                        image_url = settings.images_url + musobj.primary_image_id.substr(0, 6) + "/" + musobj.primary_image_id + settings.sidebar_image_suffix + ".jpg";
                        objname = musobj.object;
                        objtitle = '<span id="objname" class="searchable" title="Search for \'' + objname +'\'">' + objname + '</span>';
                        if(musobj.title) {
                            objname += ': ' + musobj.title;
                            objtitle += ': ' + musobj.title;
                        }
                        
                        var sidebar_image    =  '<img src="' + image_url + '" title="' + objname + '" alt="' + objname + '" width="'+ settings.sidebar_image_size +'" height="'+ settings.sidebar_image_size +'" data-objnum="' + musobj.object_number + '">';
                        $('span.object-title', sidebar).html('<span class="ui-icon ui-icon-search" style="float: left; margin-right: 2px;"></span>'+objtitle);

                        if(settings.show_more_link) {
                            var info_html = '<div class="ui-widget ui-state-highlight ui-corner-all"><div><span class="ui-icon ui-icon-extlink" style="float:left;"></span><a href="' + settings.collections_record_url + musobj.object_number + '">More details</a></div>';
                            if(settings.enable_clipboard) {
                                info_html += '<div><span class="ui-icon ui-icon-copy" style="float:left;"></span><a data-name="' + objname + '" data-objnum="' + musobj.object_number + '" data-imref="' + musobj.primary_image_id + '" class="save" href="#" title="Save this object to your clipboard">Save</a></div></div>';
                            }
                        } else {
                            var info_html = '';
                        }
                        if(typeof(musobj.descriptive_line) != 'undefined' && musobj.descriptive_line != '' && musobj.descriptive_line != ['Unknown']) { 
                            info_html += '<div class="ui-widget ui-state-highlight ui-corner-all">' + musobj.descriptive_line + '</div>';
                        }
                        info_html += '<div class="ui-widget ui-state-highlight ui-corner-all">';
                        info_html +=    '<ul>';
                        for(k=0; k<settings.tombstone.length; k++) {
                            t = settings.tombstone[k][0];
                            c = settings.tombstone[k][1];
                            if(typeof(musobj[c]) != 'undefined' && musobj[c] != '' && musobj[c] != ['Unknown']) { 
                                info_html += '<li><strong>'+t + '</strong>: ' + musobj[c] +'</li>'; 
                            };
                        }
                        info_html        +=  '</ul></div>';
                        info_html        += '<div class="ui-widget ui-state-highlight ui-corner-all" id="browse">';
                        info_html        +=  '<ul class="' + settings.tag_style + '">';                            

                        var lines = 0;

                        for( k=0; k<settings.taxonomy.length; k++ ) {
                            
                            category = musobj[settings.taxonomy[k]];
                            if(methods.countGroups(category) > 0) {
                                taxonomy_title = methods.ucfirst(settings.taxonomy[k]);
                                lines++;
                                if(settings.tag_style == 'list') {
                                    info_html += '<li><strong>' + taxonomy_title + '</strong>';
                                    info_html += '<ul>';
                                }
                                for( p=0; p < category.length; p++ ) {
                                    // TO DO: algoritmo for tag sizing
                                    s = Math.floor(Math.random()*6);
                                    cat = category[p];
                                    category_name = methods.ucfirst(cat.fields['name']);
                                    if( cat.fields['museumobject_count'] > settings.min_category_count && category_name != 'Unknown') {
                                        lines++;
                                        info_html += '<li class="size-'+parseInt(s)+'"><a href="#" data-name="' + cat.model.split('.')[1] + '" data-pk="' + cat.pk + '" data-term="' + category_name + '" title="Browse images for \'' + category_name + '\'">' + category_name + '</a></li>';
                                    };
                                }
                                if(settings.tag_style == 'list') info_html += '</ul>';
                                info_html += '</li>';
                            }
                            
                        }
                        
                        if(lines==0) {
                            info_html += '<li>Sorry, no categories for this object.</li>';
                        }
                        
                        info_html       += '</ul><div class="clearfix"></div></div>';
                        
                        $(".sidebar_image", sidebar).html(sidebar_image);
                        $(".sidebar_info", sidebar).html(info_html).height(sidebar.height() - $(".sidebar_image").outerHeight() - $(".ui-dialog-titlebar", sidebar).outerHeight()).scrollTop(0);
                        
                        // cache the fullsize img
                        var bigimg = new Image();
                        bigimg.src = image_url.replace(settings.sidebar_image_suffix, settings.large_image_suffix);
                        $('#fullsize img', wall).attr('src', bigimg.src);
                        $('#fullsize .ui-dialog-title').html(objname);
                        
                        // remove disabler overlay
                        disabled.fadeOut();
                        
                    }
                });
                
            },
                    
            apiStart: function(settings) {
                
                ajax_in_progress = true;
                $('#panel .shuffle').addClass('disabled');
                allow_shuffle = false;
                
                $.ajax({
                    dataType: 'jsonp',
                    url: methods.buildUrl(),
                    success: function (json) {
                        
                        if(json.meta.result_count <= settings.min_category_count) {
                            
                            methods.showDialog(wall, settings.alert_msg_no_images);
                            
                        } else {
                        
                            if(settings.show_loading) { methods.showLoading(); };
                        
                            if(typeof(cache_loop_id) != 'undefined') clearInterval(cache_loop_id);
                            if(typeof(fill_loop_id) != 'undefined') clearInterval(fill_loop_id);
                            if(typeof(cache) != 'undefined') delete cache;
                            offset = 0;
                            $("#grid ul li", wall).addClass('blank');
                        
                            // from the result count set the grid size
                            settings.num_results = (json.meta.result_count > settings.max_results) ? settings.max_results : json.meta.result_count;
                            settings.display_results = parseInt(settings.num_results);
                            settings.grid_width = Math.floor(Math.sqrt(settings.num_results));
                            settings.grid_height = settings.grid_width;
                            settings.max_offset = settings.grid_width * settings.grid_height;
                            
                            // populate title bar and history
                            in_hist = false;
                            if(settings.category.id != null) {
                                var title_text = 'Showing ' + settings.num_results + ' images for <span class="">' + methods.ucfirst(settings.category.name) + ': '+ methods.ucfirst(settings.category.term) + '</span>';
                                var cat_token = settings.category.id + settings.category.name + settings.category.term;
                                cat_token = cat_token.replace(/ /gi, '').toLowerCase();
                                if($.inArray(cat_token, settings.browse_hist) == -1) {
                                    settings.browse_hist.push(cat_token);
                                    $("#histlist ul").append('<li><a href="#" data-name="' + settings.category.name + '" data-pk="' + settings.category.id + '" data-term="' + settings.category.term + '">' + methods.ucfirst(settings.category.name) + ': ' + settings.category.term + '</a></li>');
                                }
                                $("#histlist").show();
                            } else if(settings.search_term != '') {
                                var title_text = 'Showing ' + settings.num_results + ' images for <span class="">' + settings.search_term + '</span>';
                                if($.inArray(settings.search_term, settings.browse_hist) == -1) {
                                    $("#histlist ul").append('<li><a href="#" data-search_term="'+settings.search_term+'" title="Search for \'' + settings.search_term + '\'">Search: '+settings.search_term+'</a></li>');
                                    settings.browse_hist.push(settings.search_term);
                                }
                                $("#histlist").show();
                            } else {
                                var title_text = settings.title_no_term;
                            }
                            if(settings.browse_hist.length > settings.max_history) {
                                $("#histlist li:first").remove();
                                settings.browse_hist.shift();
                            }
                            $("#title .title_info", wall).html(title_text);
                            
                            $("#progressbar").progressbar({ value: 0, max: settings.max_offset });
                            
                            // populate control panel
                            $('#loading p.results_info', wall).html('Loading <strong><span class="loaded">0</span>/' + settings.display_results + '</strong> images');
                            
                            // add offset attributes
                            offset_anchor = 0;
                            num_cols = $("#grid>ul:first li", wall).size();
                            tiles = $('#grid>ul>li', wall);
                            count = 0;
                            row = 0;
                            o = offset_anchor;
                            for(k=0; k < tiles.size(); k++) {
                                $(tiles[k]).data('offset', o);
                                count++;
                                if(count==num_cols) {
                                    count = 0;
                                    row++;
                                    o = row * settings.grid_width;
                                } else {
                                    o++;
                                }
                                
                            }
                            ajax_in_progress = false;
                            
                            cache = new Array();
                            cache_loop_id = setInterval(function() { methods.fillCache(settings, cache) }, settings.cache_interval);
                            fill_loop_id = setInterval(function() { methods.fillTiles(settings, cache) }, settings.fill_interval);
                            
                        }
                        
                    }
                });
                return true;
            },
                    
            resize: function(wall) {
                
                d = settings.sizes[settings.current_size];
                settings.tile_w = d.dim;
                settings.tile_h = d.dim;
                settings.cell_w = settings.tile_w + settings.tile_margin + 2; // the '2' accounts for borders
                settings.cell_h = settings.tile_h + settings.tile_margin + 2; 
                settings.start_rows = Math.ceil(settings.height / settings.cell_h);
                settings.start_cols = Math.ceil(settings.width / settings.cell_w);
                settings.tile_sidebar_image_suffix = d.suff;
                
                $('#grid', wall).html('');
                $('#panel a.resize').removeClass('selected');
                $(this).addClass('selected');
                methods.draw(wall);
                // add offset attributes
                offset_anchor = 0;
                num_cols = $("#grid>ul:first li", wall).size();
                tiles = $('#grid>ul>li', wall);
                count = 0;
                row = 0;
                o = offset_anchor;
                for(k=0; k < tiles.size(); k++) {
                    
                    $(tiles[k]).data('offset', o);
                    count++;
                    if(count==num_cols) {
                        count = 0;
                        row++;
                        o = row * settings.grid_width;
                    } else {
                        o++;
                    }
                    
                }
                        
            },
                    
            buildUrl: function(offset, limit) {
                
                if(typeof(offset)=='undefined' || isNaN(offset)) {
                    offset = 0;
                }
                
                if(typeof(limit)=='undefined' || isNaN(limit)) {
                    limit = 1;
                }
                
                if(settings.category.id != null) {
                    
                    url = settings.api_stub;
                    url += '?' + settings.category.name + '=' + settings.category.id;
                    url += '&getgroup=' + settings.category.name;
                    display_term = methods.ucfirst(settings.category.term);
                    
                } else {
                    url = settings.api_stub + settings.api_search_path;
                    url += "?q=" + settings.search_term;
                    display_term = methods.ucfirst(settings.search_term);
                    
                }
                url += '&limit=' + limit;
                url += '&offset=' + offset;
                url += "&images=1";
                
                return url;
                
            },
                    
            drawEmptyRow: function(n) {
                
                r = '<ul>';
                for(j=0; j < n; j++) { r += settings.blank_tile; }
                r += '</ul>';
                return r;
            },
            
            styleTiles: function(wall) {
             
                $('#grid li', wall).css({
                    'width': settings.tile_w,
                    'height': settings.tile_h,
                    'margin-right': settings.tile_margin,
                    'margin-bottom': settings.tile_margin,
                    'border-color': settings.tile_border_color
                });
                
            },
                    
            countGroups: function(category) {
                
                var c = 0;
                for ( n = 0; n < category.length; n++ ) {
                    if(category[0].fields['name'] != 'Unknown' && category[0].fields['museumobject_count'] > settings.min_category_count) {
                        c++;
                    }
                }
                return c;
                
            },
                    
            ucfirst: function(str) {
                return str.charAt(0).toUpperCase() + str.substr(1);

            },
                    
            draw: function(wall) {
            
                // before we do anything, let's get the current anchor offset
                
                offset_anchor = $("#grid ul:first li:first", wall).data('offset');
            
                // is there any blank space inside the wall?
                var grid = $("#grid", wall);
                
                grid.width(grid.width() + wall.position().left + wall.width());
                var tiles = {
                    'N': Math.ceil(grid.position().top / settings.cell_h),
                    'S': Math.ceil((wall.height() - grid.position().top + grid.height()) / settings.cell_h),
                    'E': Math.ceil((grid.position().left + grid.width()) / settings.cell_w),
                    'W': Math.ceil(grid.position().left / settings.cell_w)
                }
                for(prop in tiles) { tiles[prop] = tiles[prop] <0 ? 0 : tiles[prop]; }
                
                do_offsets = false;
                
                // add new rows to top
                if(tiles.N) {
                    for(i=0;i<tiles.N;i++) {
                        grid.prepend(methods.drawEmptyRow($("#grid ul:first > li", wall).size()));
                    }
                    do_offsets = true;
                }
                
                // add new rows to bottom
                if(tiles.S) {
                    for(i=0;i<tiles.S;i++) {
                        grid.append(methods.drawEmptyRow($("#grid ul:first > li", wall).size()));
                    }
                    do_offsets = true;
                }
                
                // add new cols to left
                if(tiles.W) {
                    tl = '';
                    for(i=0;i<tiles.W;i++) {
                        tl += settings.blank_tile;
                    }
                    $("#grid ul", wall).prepend(tl);
                    do_offsets = true;
                }
                
                // add new cols to right
                if(tiles.E) {
                    tr = '';
                    for(i=0;i<tiles.E;i++) {
                        tr += settings.blank_tile;
                    }
                    $("#grid ul", wall).append(tr);
                    do_offsets = true;
                }
                
                // reposition and resize the grid AFTER adding new tiles
                grid.css({
                    'top': tiles.N > 0 ? grid.position().top - tiles.N * settings.cell_h  : grid.position().top,
                    'left': tiles.W > 0 ? grid.position().left - tiles.W * settings.cell_w : grid.position().left,
                    'width': $("#grid ul:first > li", wall).length * settings.cell_w
                })
                
                // make sure all the new tiles are styled up
                methods.styleTiles(wall);
                
                // find tiles outside the viewport and remove them
                var remove = {
                    'N': Math.floor(grid.position().top * -1 / settings.cell_h),
                    'S': Math.floor( (grid.height() - wall.height() + grid.position().top) / settings.cell_h),
                    'E': Math.floor((grid.width() - wall.width() + grid.position().left) / settings.cell_w),
                    'W': Math.floor(grid.position().left * -1 / settings.cell_w)
                }
                
                for(p in remove) { remove[p] = remove[p] < 0 ? 0 : remove[p]; };
                
                tiles_removed = 0;
                while(tiles_removed < remove.W) {
                    $("#grid ul li:first-child").remove();
                    tiles_removed ++;
                    grid.css({'left': grid.position().left + settings.cell_w})
                }
                tiles_removed = 0;
                while(tiles_removed < remove.E) {
                    $("#grid ul li:last-child").remove();
                    tiles_removed ++;
                }
                rows_removed = 0;
                while(rows_removed < remove.N) {
                    $("#grid ul:first-child").remove();
                    rows_removed ++;
                    grid.css({'top': grid.position().top + settings.cell_h})
                }
                rows_removed = 0;
                while(rows_removed < remove.S) {
                    $("#grid ul:last-child").remove();
                    rows_removed ++;
                }
                            
                grid.width($("#grid ul:first > li", wall).length * settings.cell_w);
                            
                if(do_offsets) {
                    methods.updateOffsets(wall, tiles, remove, settings);
                }
            },
                    
            updateOffsets: function(wall, tiles, remove, settings) {
            
                offset_anchor = parseInt(offset_anchor);
                
                if(tiles.N > 0) {
                    offset_anchor -= settings.grid_width * tiles.N;
                    if(offset_anchor < 0) {
                        offset_anchor += settings.max_offset;
                    }
                }
                
                if(tiles.W > 0) {
                    min = Math.floor(offset_anchor/settings.grid_width) * settings.grid_width;
                    max = min + settings.grid_width -1;
                    offset_anchor -= tiles.W;
                    if(offset_anchor < min) { offset_anchor += settings.grid_width };
                }
                
                offset_anchor += remove.W;
                offset_anchor -= remove.N * settings.grid_width;
                
                // TODO: fix this:
                if(offset_anchor < 0) offset_anchor = 0;
                
                offset = offset_anchor - settings.limit;
                
                num_cols = $("#grid>ul:first li", wall).size();
                rows = $('#grid>ul');
                
                for(j=0;j<rows.size();j++) {
                 
                    o = offset_anchor + (j * settings.grid_width);
                    if(o>=settings.max_offset) {
                        o -= settings.max_offset;
                    }
                 
                    tiles = $("li", rows[j]);
                    
                    min = Math.floor(o/settings.grid_width) * settings.grid_width;
                    max = min + settings.grid_width -1;
                 
                    for(i=0;i<tiles.size();i++) {
                        
                        $(tiles[i]).data('offset', o);
                        o++;
                        if(o > max) {
                            o = min;
                        }
                        
                    }
                    
                    o = max + 1;
                    if(o >= settings.max_offset-1) {
                        o -= settings.max_offset;
                    }
                    
                }
                
            },
             
            getImageUrl: function(url_base, image_ref) {
                
                try {
                    u = url_base + image_ref.substr(0, 6) + "/" + image_ref + settings.tile_sidebar_image_suffix + ".jpg";
                } catch(err) {
                    u = "";
                }
                return u;
            },
              
                    
            retrieveFromCache: function(offset) {
                
                for(q in cache) {
                    if(cache[q].offset == offset) return cache[q];
                }
                if(cache_full) {
                    $.ajax({
                            dataType: 'jsonp',
                            url: methods.buildUrl(offset, 1),
                            success: function (json) {
                                for(i=0;i<json.records.length;i++) {
                                    record = json.records[i];
                                    obj = {};
                                    obj.offset = offset;
                                    obj.imref = record.fields.primary_image_id;
                                    obj.num = record.fields.object_number;
                                    if(record.fields.title) {
                                        objname = record.fields.object + ' ' + record.fields.title;
                                    } else {
                                        objname = record.fields.object;
                                    }
                                    obj.title = objname;
                                    cache.push(obj);
                                };
                            }
                        });
                }
                return false;
            },
                        
            fillCache: function(settings, cache) {

                if(typeof(offset)=='undefined' || isNaN(offset) || offset < 0) {
                    offset = 0;
                }
                
                if(cache.length < settings.max_offset) {
                
                    cache_full = false;
                
                    if(!ajax_in_progress) {
                
                        ajax_in_progress = true;
                        url = methods.buildUrl(offset, settings.limit);
                        $.ajax({
                            dataType: 'jsonp',
                            url: url,
                            success: function (json) {
                                for(i=0;i<json.records.length;i++) {
                                    record = json.records[i];
                                    cache_obj = {};
                                    cache_obj.offset = offset;
                                    cache_obj.imref = record.fields.primary_image_id;
                                    cache_obj.num = record.fields.object_number;
                                    if(record.fields.title) {
                                        objname = record.fields.object + ' ' + record.fields.title;
                                    } else {
                                        objname = record.fields.object;
                                    }
                                    cache_obj.title = objname;
                                    cache.push(cache_obj);
                                    offset ++;
                                };
                                if(offset >= settings.max_offset && cache.length < settings.max_offset) { offset = 0; };
                                ajax_in_progress = false;
                                $("#progressbar").progressbar({ value: cache.length });
                                $("#loading .loaded").html(cache.length);
                            }
                        });
                    
                    }
                    
                } else { // cache is full
                    $('#panel .shuffle').removeClass('disabled');
                    allow_shuffle = true;
                    clearInterval(cache_loop_id);
                    cache_full = true;
                    setTimeout(methods.hideLoading, settings.hide_loader_time);
                    $("#loading .loaded").html(settings.display_results);
                    r = Math.floor(Math.random()*settings.tips.length);
                    $('#loading span.ui-dialog-title').html('Done.');
                    $('#loading .results_info').html('<span style="float: left; margin-right: .3em;" class="ui-icon ui-icon-info"></span><strong>Tip:</strong> ' + settings.tips[r]);
                }
                
            },
            
            hideLoading: function() {
                $('#loading').fadeOut();
            },
            
            fillTile: function(tile, item) {
                
                if(tile && typeof(tile) != 'undefined') {
                    tile
                        .css({ 'background-image': 'url('+methods.getImageUrl(settings.images_url, item.imref)+')'})
                        .attr('title', item.title + ' [' + item.num + ']')
                        .data('objnum', item.num)
                        .removeClass('blank');
                }
            },
            
            fillTiles: function(settings, cache) {
               
                switch(settings.fill_direction) {
                    case 'forwards':
                        t = $("ul li.blank:first");
                        break;
                    case 'backwards':
                        t = $("ul li.blank:last");
                        break;
                    case 'random':
                        tt = $("ul li.blank");
                        t = $(tt[Math.floor(Math.random()*tt.length)]);
                        break;
                    default:
                        t = $("ul li.blank:first");
                        break;
                }
                var item = methods.retrieveFromCache(t.data('offset'), cache);
                if(item) {
                    methods.fillTile(t, item);
                } 
                
            }
                
                
        }
        

        settings.current_size = settings.start_size;
        settings.tile_w = settings.sizes[settings.current_size].dim;
        settings.tile_h = settings.sizes[settings.current_size].dim;
        settings.tile_sidebar_image_suffix = settings.sizes[settings.current_size].suff;
        settings.cell_w = settings.tile_w + settings.tile_margin + 2; // the '2' accounts for borders
        settings.cell_h = settings.tile_h + settings.tile_margin + 2; 
        settings.start_rows = Math.ceil(settings.height / settings.cell_h);
        settings.start_cols = Math.ceil(settings.width / settings.cell_w);
     
        settings.sidebar_width = settings.sidebar_image_size;
     
        // write out an empty grid
        var grid_html = '<div id="grid">';
        for(i=0; i < settings.start_rows; i++) {
            grid_html += methods.drawEmptyRow(settings.start_cols);
        }
        grid_html += '</div>';
        this.html(grid_html);
        
        // record the starting size and position, so we can go back to it after fullscreen
        settings.start = {
            'top': this.position().top,
            'left': this.position().left
        }
        settings.fullscreen = false;

        // apply styles to the empty grid
        this.css({
            'width': settings.width,
            'height': settings.height,
            'background-color': settings.background_color,
            'border': settings.wall_border
        });
        $("#grid", this).css({
            'width': settings.cell_w * settings.start_cols
        });
        methods.styleTiles();

        // control panel
        var panel   =     '<div id="panel" class="ui-widget ui-widget-content ui-corner-all">';
        panel       +=    '<ul id="icons">';
        panel       +=    '<li><input class="ui-state-default ui-corner-all" type="text" name="search" value="'+settings.search_box_default+'"></li>';
        panel       +=    '<li class="ui-state-default ui-corner-all"><span class="submitsearch ui-icon ui-icon-search" title="Submit search"></span></li>';
        panel       +=    '<li class="ui-state-default ui-corner-all"><span class="fullscreen ui-icon ui-icon-arrow-4-diag" title="Toggle full screen"></span></li>';
        panel       +=    '<li class="ui-state-default ui-corner-all"><span class="shuffle ui-icon ui-icon-shuffle" title="Shuffle images"></span></li>';
        panel       +=    '<li class="ui-state-default ui-corner-all"><span class="zoomin ui-icon ui-icon-zoomin" title="Larger tiles"></span></li>';
        panel       +=    '<li class="ui-state-default ui-corner-all"><span class="zoomout ui-icon ui-icon-zoomout" title="Smaller tiles"></span></li>';
        if(settings.enable_history) { panel += '<li class="ui-state-default ui-corner-all"><span class="togglehist ui-icon ui-icon-clock" title="Toggle history panel"></span></li>' };
        if(settings.enable_clipboard) { panel += '<li class="ui-state-default ui-corner-all"><span class="toggleclip ui-icon ui-icon-clipboard" title="Toggle clipboard"></span></li>' };
        panel       +=    '</ul>'
        panel       +=    '</div>';
        
        // sidebar
        var sidebar =      '<div id="sidebar"  class="ui-dialog ui-widget ui-widget-content ui-corner-all">';
        sidebar     +=     '<div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix"><span class="ui-dialog-title object-title"></span><a href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button"><span class="ui-icon ui-icon-closethick">close</span></a></div>';
        sidebar     +=     '<div class="sidebar_image"></div>';
        sidebar     +=     '<div class="sidebar_info"></div>';
        sidebar     +=     '</div>';
        
        // dialog box
        var dialog      =       '<div id="dialog" class="ui-dialog ui-widget ui-widget-content ui-corner-all">';
        dialog          +=      '<div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix"><span class="ui-dialog-title">'+settings.alert_title+'</span><a href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button"><span class="ui-icon ui-icon-closethick">close</span></a></div>';
        dialog          +=      '<p><span style="float: left; margin-right: .3em;" class="ui-icon ui-icon-alert"></span><span id="dialog_text"></span></p>';
        dialog          +=      '<div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix"><div class="ui-dialog-buttonset"><button type="button" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">Ok</span></button></div></div>';
        dialog          +=      '</div>';
        
        // loading dialog
        var loading     =       '<div id="loading" class="ui-dialog ui-widget ui-widget-content ui-corner-all">';
        loading          += '<div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix"><span class="ui-dialog-title">Please wait...</span><a href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button"><span class="ui-icon ui-icon-closethick">close</span></a></div>';
        loading         +=      '<p class="results_info"></p>';
        loading         +=      '<div id="progressbar"></div>';
        loading         +=      '</div>';
        
        // title bar
        var title       =       '<div id="title" class="ui-dialog ui-widget ui-widget-content ui-corner-all">';
        title           +=      '<p class="title_info"></p>';
        title           +=      '</div>';
        
        // fullsize dialog
        var fs          =       '<div id="fullsize" class="ui-dialog ui-widget ui-widget-content ui-corner-all">';
        fs              +=       '<div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix"><span class="ui-dialog-title"></span><a href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button"><span class="ui-icon ui-icon-closethick">close</span></a></div>';
        fs              +=      '<img src="" alt="" title="" />';
        fs              +=      '</div>';
        
        // history panel
        var hist     =       '<div id="hist" class="ui-dialog ui-widget ui-widget-content ui-corner-all">';
        hist          += '<div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix"><span class="ui-dialog-title">Your history</span><a href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button"><span class="ui-icon ui-icon-closethick">close</span></a></div>';
        hist         +=      '<div id="histlist" class="ui-widget ui-state-highlight ui-corner-all hide"><ul class="list"></ul></div>';
        hist         +=      '</div>';
        
        var clipboard     =       '<div id="clipboard" class="ui-dialog ui-widget ui-widget-content ui-corner-all">';
        clipboard          += '<div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix"><span class="ui-dialog-title">Your clipboard</span><a href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button"><span class="ui-icon ui-icon-closethick">close</span></a></div>';
        clipboard         +=      '<div id="clipboardlist" class="ui-widget ui-state-highlight ui-corner-all hide"><ul class="list"></ul><div class="clearfix"></div></div>';
        clipboard         +=      '</div>';
        
        var disabled     =       '<div id="disabled" class="ui-widget-overlay"></div>';
        
        $("#grid").after(sidebar).after(panel).after(dialog).after(loading).after(title).after(fs).after(disabled).after(hist).after(clipboard);
        $('#panel').css({
            'left': this.width()/2 - $('#panel').width()/2,
            'bottom': 0
        })
        allow_shuffle = false;
        fullsize_dragged = false;
        cache_full = false;
        settings.browse_hist = [];
        settings.cliplist = [];
        settings.clipboard = [];
        
        methods.apiStart(settings);
        
        // initialize the draggable grid
        $('#grid', this).draggable({
        
            cursor: 'pointer',
            delay: 150,
            stop: function() { 
                methods.draw($(this.parentNode)); // <== 'this' is the draggable, which is $('#grid'), so its parentNode is the wall div
            }
            
        });
        
        $('#loading', this).draggable({
            containment: 'parent'
        });

        $('#fullsize', this).draggable({
            containment: 'parent',
            stop: function() {
                fullsize_dragged = true;
            }
        });

        $('#hist', this).draggable({
            containment: 'parent'
        });

        $('#clipboard', this).draggable({
            containment: 'parent'
        });

        this
            .delegate('#icons li span', 'mouseover', function(event) {
                $(this).parent().addClass('ui-state-hover');
            })
            .delegate('#icons li span', 'mouseout', function(event) {
                $(this).parent().removeClass('ui-state-hover');
            })
            .delegate('#panel span.fullscreen', 'click', function(event) {
                event.preventDefault();
                
                var sidebar = $("#sidebar", wall);
                
                if (settings.fullscreen) {
                    // shrink
                    $("body").css({'overflow': 'auto'});
                    wall.prependTo(old_parent)
                        .animate({
                        'width': settings.width,
                        'height': settings.height,
                    }, settings.fullscreen_speed, function() { 
                        
                        if(sidebar.is(':visible')) {
                            sidebar.animate({
                                'width': settings.sidebar_width,
                                'height': wall.height() - 2*settings.padding,
                                'top': 0,
                                'left': wall.width() - (settings.sidebar_width + 2*settings.padding),
                                'padding': settings.padding
                            }, settings.fullscreen_speed, function() {});
                        }
                        
                        var p = $('#panel', wall);
                        $("#sidebar").hide();
                        p.css({'left':0}).css({
                            'left': wall.width()/2 - p.width()/2,
                            'bottom': 0
                        })
                        var l = $('#loading');
                        l.css({
                            'left': wall.width()/2 - l.width()/2,
                        })
                        settings.fullscreen = false;
                        methods.draw(wall);
                        
                    });
                    
                } else {
                    // expand
                    old_parent = wall.parent();
                    wall.prependTo($("body"));
                    $("body").css({'overflow': 'hidden'});
                    $(window).scrollTop(0);
                    wall.animate({
                        'width': $(document).width(),
                        'height': $(window).height(),
                    }, settings.fullscreen_speed, function() { 
                       
                        if(sidebar.is(':visible')) {
                            sidebar.animate({
                                'width': settings.sidebar_width,
                                'height': wall.height() - 2*settings.padding,
                                'top': 0,
                                'left': wall.width() - (settings.sidebar_width + 2*settings.padding),
                                'padding': settings.padding
                            }, settings.fullscreen_speed, function(){
                                $(".sidebar_info", sidebar).height(sidebar.height() - $(".sidebar_image").height());
                            });
                        }
                        
                        var p = $('#panel');
                        p.css({
                            'left': wall.width()/2 - p.width()/2,
                            'bottom': 0
                        })
                        var l = $('#loading');
                        l.css({
                            'left': wall.width()/2 - l.width()/2,
                        })
                        settings.fullscreen = true;
                        methods.draw(wall);
                    });
                    
                }
                
            })
            .delegate('#panel span.zoomin', 'click', function(event) {
                
                event.preventDefault();
                
                max_size = settings.sizes.length-1;
                if(settings.current_size < max_size) {
                    settings.current_size++;
                    methods.resize(wall);
                    
                } else {
                    methods.showDialog(wall, settings.alert_msg_zoom_max);
                }
                 
            })
            .delegate('#panel span.zoomout', 'click', function(event) {
                
                if(settings.current_size > 0) {
                
                    settings.current_size--;
                    methods.resize(wall);
                   
                    
                } else {
                    methods.showDialog(wall, settings.alert_msg_zoom_min);
                }
                 
            })
            .delegate('#panel span.togglehist', 'click', function(event) {
                
                $("#hist", wall).toggle('fast');
                
            })
            .delegate('#panel span.toggleclip', 'click', function(event) {
                
                $("#clipboard", wall).toggle('fast');
                
            })
            .delegate('#panel span.submitsearch', 'click', function(event) {
                
                search_term = $('#panel input[name="search"]', wall).val();
                if(search_term!='' && search_term != settings.search_box_default) {
                    
                    settings.category = {
                        'id': null,
                        'name': '',
                        'term': '',
                    }
                    settings.search_term = search_term;
                    methods.apiStart(settings);
                    
                    
                } else {
                    methods.showDialog(wall, settings.alert_msg_enter_search);
                }
                
            })
            .delegate('#panel input[name="search"]', 'keyup', function(event) {
               
                event.preventDefault();
                
                var code = (event.keyCode ? event.keyCode : event.which);
                if(code == 13) { // User has pressed the enter key
                    search_term = $(this).val();
                    
                    if(search_term!='' && search_term != settings.search_box_default) {
                        
                        settings.category = {
                            'id': null,
                            'name': '',
                            'term': ''
                        }
                        settings.search_term = search_term;
                        methods.apiStart(settings);

                    } else {
                        methods.showDialog(wall, settings.alert_msg_enter_search);
                    }
                }

            })
            .delegate('#panel input[name="search"]', 'focus', function(event) {
                
                event.preventDefault();
                $(this).val('');
                
            })
            .delegate('#panel input[name="search"]', 'click', function(event) {
                
                event.preventDefault();
                $(this).val('');
                
            })
            .delegate('#histlist a', 'click', function(event) {
                
                event.preventDefault();
                if($(this).data('search_term')) {
                    settings.category = {
                        'id': null,
                        'name': '',
                        'term': ''
                    }
                    settings.search_term = $(this).data('search_term');
                } else {
                    settings.category = {
                        'id': $(this).data('pk'),
                        'name': $(this).data('name'),
                        'term': $(this).data('term')
                    }
                }
                methods.apiStart(settings);
                
            })
            .delegate('.searchable', 'click', function(event) {
               
                search_term = $(this).html();
                $('#panel input[name="search"]', wall).val(search_term);
                if(search_term!='' && search_term != settings.search_box_default) {
                    
                    settings.category = {
                        'id': null,
                        'name': '',
                        'term': ''
                    }
                    settings.search_term = search_term;
                    methods.apiStart(settings);

                } else {
                    methods.showDialog(wall, settings.alert_msg_enter_search);
                }
                
            })
            .delegate('#panel span.shuffle', 'click', function(event) {
               
                if(allow_shuffle) {
                
                    keys = [];
                    shuffle = [];
                    for(d=0; d<settings.max_offset; d++) { shuffle[Math.random() * 1] = d; }
                    for(r in shuffle) { keys.push(r); };
                    keys.sort();
                    tiles = $('#grid li', wall);
                    count = 0;
                    for(k in keys) {
                        methods.fillTile($(tiles[count]), methods.retrieveFromCache(shuffle[keys[k]], cache));
                        count ++;
                    }
                    
                }
                
            })
            .delegate('.ui-dialog-titlebar-close', 'click', function(event) {
                event.preventDefault();
                $(this).parent().parent().hide();
            })
            .delegate('button', 'click', function(event) {
                event.preventDefault();
                $('#dialog', wall).hide();
            })
            .delegate('#grid ul li', 'click', function(event) { methods.populateSidebar(wall, $(this).data('objnum')); })
            .delegate('#sidebar a.save', 'click', function(event) {
                
                event.preventDefault();
                
                objnum = $(this).data('objnum');
                imref = $(this).data('imref');
                
                clipobj = {
                    objnum: objnum,
                    name: $(this).data('name'),
                    img: settings.images_url + imref.substr(0, 6) + "/" + imref + "_jpg_s.jpg"
                }
                
                if($.inArray($(this).data('objnum'), settings.cliplist) == -1) { 

                    settings.cliplist.push(objnum);
                    settings.clipboard.push(clipobj);
                    var clipitem = '<li data-objnum="' + objnum + '">';
                    clipitem += '<img src="' + clipobj.img + '" alt="' + clipobj.name + '" title="' + clipobj.name + '" />';
                    clipitem += '</li>';
                    $("#clipboardlist ul").append(clipitem); 
                    $("#clipboardlist").show(); 
                    
                }
                
            })
            .delegate('#clipboard li', 'click', function(event) { methods.populateSidebar(wall, $(this).data('objnum')); })
            .delegate('#sidebar a.close', 'click', function(event) { 
             
                event.preventDefault();
                
                $('#sidebar', wall).hide();
                
            })
            .delegate('#browse a', 'click', function(event) { 
               
                event.preventDefault();
                
                settings.category = {
                    'id': $(this).data('pk'),
                    'name': $(this).data('name'),
                    'term': $(this).data('term'),
                }
                methods.apiStart(settings);
                $('#panel input[name="search"]', wall).val('New search');
        
            })
            .delegate('#sidebar img', 'click', settings.event_click_sidebar_img);
            

        
        //~ return this.each(function() {
        //~ 
            //~ 
            //~ 
        //~ })

    }

})( jQuery );
