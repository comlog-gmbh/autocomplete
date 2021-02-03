# autocomplete
Bootstrap 4 compatible autocomplete

## Examples
### Static source
```javascript
$('.search-input')
    .autocomplete({
        source: ['Value 1', 'Value 2', 'Value 3']
    })
    .on('autocomplete.preselect', function (event, data, jItem) {
        // do somthing
    })
    .on('autocomplete.select', function (event, data, jItem) {
        // do somthing
    });
```
### Extended static source
```javascript
$('.search-input')
    .autocomplete({
        source: [
            {value: 'v1', label: 'Value 1', extradata: '...'},
            {value: 'v2', label: 'Value 2', extradata: '...'},
            {value: 'v3', label: 'Value 3', extradata: '...'}
        ]
    })
    .on('autocomplete.preselect', function (event, data, jItem) {
        // do somthing
    })
    .on('autocomplete.select', function (event, data, jItem) {
        // do somthing
        // console.info(data.value)
        // console.info(data.label)
        // console.info(data.extradata)
    });
```

### Dynamic source
```javascript
$('.search-input')
    .autocomplete({
        source: '/autocomplete.php' // response in json format
    });
```

### Dynamic source custom
```javascript
$('.search-input')
    .autocomplete({
        source: function (request, response) {
        	var ajaxOpt = {url: 'ac.php', data:{term: request.term}};
        	$.ajax(ajaxOpt).done(function (data) {
                response(data);
			});
        }
    });
```

## Options
**minLength**: min length to start autocomplete. Default: 1
**delay**: Timeout before display autocomplete. Default: 300 ms 
**source**: Source
**zIndex**: minimal zIndex. Default: 100
**autoFocus**: Autofocus first match: Default false
**ignoreKeys**: Default: '|9|16|17|18|19|33|34|35|36|37|39|45|144|145|'
**renderMenu**: Function to create menu widget.

Example:
```javascript
$('.search-input')
	.autocomplete({
		...,
		renderMenu: function () { return $('<div class="dropdown-menu" />'); },
		...        
	})

```

**renderItem**: Function to create menu item.
Example:
```javascript
$('.search-input')
	.autocomplete({
		...,
		renderMenu: function (menu, item) {
			return $('<a href="javascript: void(0)" />')
				.addClass('dropdown-item text-wrap')
				.data('data', item)
				.html(item.label || item.value)
				.appendTo(menu)
			;
		},
		...        
	})

```

**matcher**: Function or Boolean. False for disable default matcher.
```javascript
$('.search-input')
	.autocomplete({
		...,
		matcher: function (rowData, search, cb) {
			var text = (rowData.label || rowData.text || rowData.value).toUpperCase();
			if (text.indexOf(search.toUpperCase()) > -1) {
				return cb(true);
			}

			cb(false);
		},
		...        
	})

```

**highlight**: Function or False. False will disable highlight.

**destroy**: Destroy autocomplete

## jQuery UI compatible
```javascript
// Get option
$('.search-input').autocomplete('option', 'matcher');
// Set option
$('.search-input').autocomplete('option', 'matcher', false);

// Run function
$('.search-input').autocomplete('show');
$('.search-input').autocomplete('search', 'searchfor');
```
